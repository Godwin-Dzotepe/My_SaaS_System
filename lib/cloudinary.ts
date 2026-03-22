const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function sha1(value: string) {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  return toHex(hashBuffer);
}

export function isCloudinaryConfigured() {
  return Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);
}

export async function uploadImageToCloudinary(file: File, folder: string) {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured on this server.');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Only image uploads are supported.');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const safeFolder = folder.replace(/^\/+|\/+$/g, '');
  const signatureBase = `folder=${safeFolder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  const signature = await sha1(signatureBase);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', CLOUDINARY_API_KEY!);
  formData.append('timestamp', String(timestamp));
  formData.append('folder', safeFolder);
  formData.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.secure_url) {
    throw new Error(payload?.error?.message || 'Failed to upload image to Cloudinary.');
  }

  return {
    url: payload.secure_url as string,
    publicId: payload.public_id as string | undefined,
  };
}
