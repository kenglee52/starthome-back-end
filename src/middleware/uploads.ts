import multer from "multer";
import fs from "fs";
import path from "path";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

// 🔹 ຕັ້ງຄ່າ S3 client (ໃຊ້ IAM Role ຂອງ EC2)
export const s3 = new S3Client({
  region: "ap-southeast-2",
});

// 🔹 Multer: ສ້າງໄຟລ໌ຊົ່ວຄາວກ່ອນສົ່ງໄປ S3
const upload = multer({ dest: "temp_uploads/" });

// 🔹 Function ອັບໂຫລດໄປ S3
export const uploadToS3 = async (file: Express.Multer.File) => {
  const fileStream = fs.createReadStream(file.path);
  const key = `${file.fieldname}/${Date.now()}-${file.originalname}`;

  const parallelUpload = new Upload({
    client: s3,
    params: {
      Bucket: "star-home-s3", // 👈 ໃສ່ຊື່ bucket ຂອງເຈົ້າ
      Key: key,
      Body: fileStream,
      ContentType: file.mimetype,
    },
  });

  const result = await parallelUpload.done();

  // ລຶບໄຟລ໌ທ້ອງຖິ່ນຫຼັງຈາກອັບໂຫລດສໍາເລັດ
  fs.unlinkSync(file.path);

  return result.Location; // ສົ່ງ URL ຂອງໄຟລ໌ກັບ
};

export default upload;
