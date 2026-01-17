import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function downloadFile(data: Blob, filename: string) {
  const url = window.URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export async function parseServerError(error: any) {
  let errorData: any = {};

  if (error.response?.data instanceof Blob) {
    try {
      const text = await error.response.data.text();
      errorData = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse error blob:', e);
    }
  } else {
    errorData = error.response?.data || {};
  }
  
  return errorData;
}