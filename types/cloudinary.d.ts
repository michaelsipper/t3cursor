// File: types/cloudinary.d.ts

declare module "cloudinary" {
    export namespace v2 {
      interface UploadApiResponse {
        asset_id: string;
        public_id: string;
        version: number;
        version_id: string;
        signature: string;
        width: number;
        height: number;
        format: string;
        resource_type: string;
        created_at: string;
        tags: string[];
        bytes: number;
        type: string;
        etag: string;
        placeholder: boolean;
        url: string;
        secure_url: string;
        original_filename: string;
      }
  
      interface UploadApiErrorResponse {
        message: string;
        name: string;
        http_code: number;
      }
  
      type UploadResponseCallback = (
        error: UploadApiErrorResponse | null | undefined,
        result: UploadApiResponse | undefined
      ) => void;
    }
  }
  