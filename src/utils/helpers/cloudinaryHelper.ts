// import { v2 as cloudinary } from "cloudinary";
import cloudinary from "../../config/cloudinary";


export const cloudinaryHelper = {
  uploadImage: async (filePath: string, folder = "vireworkplace") => {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type: "image",
      });
      return { url: result.secure_url, publicId: result.public_id };
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new Error("Image upload failed");
    }
  },

  uploadFile: async (filePath: string, folder = "vireworkplace") => {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type: "auto",
      });
      return { url: result.secure_url, publicId: result.public_id };
    } catch (error) {
      console.error("Cloudinary file upload error:", error);
      throw new Error("File upload failed");
    }
  },

  deleteFile: async (publicId: string) => {
    try {
      await cloudinary.uploader.destroy(publicId);
      return true;
    } catch (error) {
      console.error("Cloudinary delete error:", error);
      throw new Error("File deletion failed");
    }
  },
};