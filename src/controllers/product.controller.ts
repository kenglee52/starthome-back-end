import { Request, Response } from "express";
import { Op, fn, col } from "sequelize";
import { Product } from "../models/product.model";
import { District } from "../models/district.model";
import { Province } from "../models/province.model";
import { ProductType } from "../models/product_type.model";
import { Owner } from "../models/owner.model";
import { Currency } from "../models/currency.model";
import { uploadToS3 } from "../middleware/uploads";

/* ---------------------------------------------
   📌 1. Generate Auto Product ID
--------------------------------------------- */
export const getProductAutoId = async (req: Request, res: Response) => {
  try {
    const lastProduct = await Product.findOne({
      order: [['productID', 'DESC']],
    });

    let newId: string;
    if (!lastProduct) newId = 'HXV0001';
    else {
      const lastNumber = parseInt(lastProduct.productID.replace('HXV', ''), 10);
      newId = `HXV${(lastNumber + 1).toString().padStart(4, '0')}`;
    }

    res.status(200).json({ newId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ---------------------------------------------
   📌 2. Helper functions
--------------------------------------------- */
function parseMaybeArray(val: string | string[]): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [val];
  } catch {
    return [val];
  }
}

function parseProductMedia(product: any) {
  return {
    ...product,
    image: parseMaybeArray(product.image),
    video: parseMaybeArray(product.video),
  };
}

/* ---------------------------------------------
   📌 3. Get & Search Products
--------------------------------------------- */
export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.findAll({
      include: [
        { model: District, include: [Province] },
        { model: Owner },
        { model: Currency },
      ],
      order: [['productID', 'DESC']],
    });

    res.status(200).json(products.map(p => parseProductMedia(p.toJSON())));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const searchAllProducts = async (req: Request, res: Response) => {
  const search = req.query.search || "";
  try {
    const results = await Product.findAll({
      include: [
        {
          model: District,
          include: [{ model: Province }],
        },
      ],
      where: {
        [Op.or]: [
          { productID: { [Op.like]: `%${search}%` } },
          { productName: { [Op.like]: `%${search}%` } },
          { village: { [Op.like]: `%${search}%` } },
          { '$District.districtName$': { [Op.like]: `%${search}%` } },
          { '$District.Province.provinceName$': { [Op.like]: `%${search}%` } },
        ],
      },
      order: [['productID', 'DESC']],
    });

    res.status(200).json(results.map(p => parseProductMedia(p.toJSON())));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ---------------------------------------------
   📌 4. Create Product (Upload images/videos → S3)
--------------------------------------------- */
export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      productID,
      productName,
      ownerID,
      productTypeID,
      village,
      districtID,
      status,
      size,
      price,
      tel,
      description,
      currencyID,
    } = req.body;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files || (!files.image && !files.video)) {
      return res.status(400).json({ error: "Image and/or video files required." });
    }

    const imageUrls = files.image
      ? await Promise.all(files.image.map((f) => uploadToS3(f)))
      : [];

    const videoUrls = files.video
      ? await Promise.all(files.video.map((f) => uploadToS3(f)))
      : [];

    const newProduct = await Product.create({
      productID,
      productName,
      ownerID,
      productTypeID,
      village,
      districtID,
      status,
      size,
      price,
      image: JSON.stringify(imageUrls),
      video: JSON.stringify(videoUrls),
      tel,
      description,
      currencyID,
    });

    res.status(201).json(newProduct);
  } catch (err) {
    console.error("❌ Create product error:", err);
    res.status(500).json({ error: "Failed to create product", details: err });
  }
};

/* ---------------------------------------------
   📌 5. Update Product (Upload new → S3)
--------------------------------------------- */
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { productID } = req.params;
    const product = await Product.findOne({ where: { productID } });

    if (!product) return res.status(404).json({ error: "Product not found" });

    // ຮັບ files ຈາກ multer
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    // upload รูป/วิดีโอใหม่ແລ້ວ filter undefined
    const newImages: string[] = files?.image
      ? (await Promise.all(files.image.map(f => uploadToS3(f)))).filter((url): url is string => !!url)
      : [];

    const newVideos: string[] = files?.video
      ? (await Promise.all(files.video.map(f => uploadToS3(f)))).filter((url): url is string => !!url)
      : [];

    // ຮູບ/ວິດີໂອເກົ່າ
    const oldImages: string[] = typeof product.image === "string"
      ? JSON.parse(product.image || "[]")
      : Array.isArray(product.image)
        ? product.image
        : [];

    const oldVideos: string[] = typeof product.video === "string"
      ? JSON.parse(product.video || "[]")
      : Array.isArray(product.video)
        ? product.video
        : [];

    // merge เก่า + ใหม่
    const imageList = oldImages.concat(newImages);
    const videoList = oldVideos.concat(newVideos);

    // update database
    await product.update({
      ...req.body,
      image: JSON.stringify(imageList),
      video: JSON.stringify(videoList),
    });

    res.status(200).json({ message: "Product updated successfully", product });
  } catch (err) {
    console.error("❌ Update product error:", err);
    res.status(500).json({ error: "Failed to update product", details: err });
  }
};


/* ---------------------------------------------
   📌 6. Delete Product
--------------------------------------------- */
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    await Product.destroy({ where: { productID: req.params.productID } });
    res.status(200).json({ message: "Delete success" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ---------------------------------------------
   📌 7. Remove single media (image/video)
--------------------------------------------- */
export const removeProductMediaByIndex = async (req: Request, res: Response) => {
  try {
    const { productID, mediaType, index } = req.body;

    const product = await Product.findByPk(productID);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let mediaArray = parseMaybeArray(
      mediaType === "image" ? product.image : product.video
    );

    if (index < 0 || index >= mediaArray.length)
      return res.status(400).json({ message: "Invalid index" });

    mediaArray.splice(index, 1);

    await product.update({
      [mediaType]: JSON.stringify(mediaArray),
    });

    res
      .status(200)
      .json({ message: `${mediaType} removed`, media: mediaArray });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

/* ---------------------------------------------
   📌 8. Add single media to existing product
--------------------------------------------- */
export const addImageToProduct = async (req: Request, res: Response) => {
  try {
    const { productID } = req.params;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files?.image?.length)
      return res.status(400).json({ message: "No image uploaded" });

    const product = await Product.findByPk(productID);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const newUrls = await Promise.all(files.image.map(uploadToS3));
    const updated = [...parseMaybeArray(product.image), ...newUrls];

    await product.update({ image: JSON.stringify(updated) });
    res.status(200).json({ message: "Image added", images: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

export const addVideoToProduct = async (req: Request, res: Response) => {
  try {
    const { productID } = req.params;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files?.video?.length)
      return res.status(400).json({ message: "No video uploaded" });

    const product = await Product.findByPk(productID);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const newUrls = await Promise.all(files.video.map(uploadToS3));
    const updated = [...parseMaybeArray(product.video), ...newUrls];

    await product.update({ video: JSON.stringify(updated) });
    res.status(200).json({ message: "Video added", videos: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

/* ---------------------------------------------
   📌 9. Count Functions
--------------------------------------------- */
export const getProductCount = async (req: Request, res: Response) => {
  try {
    const result = await Product.findAndCountAll();
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getTypeCount = async (req: Request, res: Response) => {
  try {
    const results = await Product.findAll({
      attributes: [
        "productTypeID",
        [fn("COUNT", col("product.productID")), "count"],
      ],
      group: ["productTypeID"],
      include: [{ model: ProductType, attributes: ["productTypeName"] }],
    });
    res.status(200).json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
