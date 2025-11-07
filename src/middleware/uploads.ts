// import multer from 'multer';
// import path from 'path';

// // ການກຳນົດທາງການເກັບຟາຍຕາມ fieldname
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     if (file.fieldname === 'image') {
//       cb(null, 'uploads/images');
//     } else if (file.fieldname === 'video') {
//       cb(null, 'uploads/videos');
//     } else {
//       cb(null, 'uploads/others');
//     }
//   },
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     cb(null, Date.now() + '-' + file.fieldname + ext);
//   },
// });

// const upload = multer({ storage });

// export default upload;

import multer from "multer";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import path from "path";
import fs from "fs";

// 🔹 ສ້າງ S3 client ໃຊ້ IAM Role ຂອງ EC2
const s3 = new S3Client({
  region: "ap-southeast-2",
});

// 🔹 Multer ຈະເກັບໄຟລ໌ຊົ່ວຄາວກ່ອນອັບໂຫລດໄປ S3
const upload = multer({ dest: "temp_uploads/" });

// 🔹 Function ອັບໂຫລດໄຟລ໌ໄປ S3
export const uploadToS3 = async (file:Express.Multer.File) => {
  const fileStream = fs.createReadStream(file.path);
  const ext = path.extname(file.originalname);
  const key = `${file.fieldname}/${Date.now()}-${file.originalname}`;

  const parallelUpload = new Upload({
    client: s3,
    params: {
      Bucket: "star-home-s3", // 👉 ໃສ່ຊື່ bucket ຂອງເຈົ້າ
      Key: key,
      Body: fileStream,
      ContentType: file.mimetype,
    },
  });

  const result = await parallelUpload.done();
  fs.unlinkSync(file.path); // ລຶບໄຟລ໌ທີ່ເກັບໄວ້ຊົ່ວຄາວ
  return result.Location; // ສົ່ງ URL ກັບ
};

export default upload;

