const multer = require("multer");
const path   = require("path");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "server/uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const imageTypes = /jpg|jpeg|png|webp/;
    const videoTypes = /mp4|mov|webm|avi/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.','');

    if (imageTypes.test(ext) || videoTypes.test(ext)) {
        cb(null, true);
    } else {
        cb(new Error("Only images (jpg,png,webp) and videos (mp4,mov,webm) are allowed"));
    }
};

module.exports = multer({ storage, fileFilter });