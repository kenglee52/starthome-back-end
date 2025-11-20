import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./claudinary";

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: file.fieldname === "image" ? "products/images" : "products/videos",
    resource_type: file.fieldname === "video" ? "video" : "image",
  }),
});

const upload = multer({ storage });

export default upload;
