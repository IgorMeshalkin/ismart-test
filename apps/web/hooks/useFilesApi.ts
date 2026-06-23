type CreateFileParams = {
  originalName: string;
  durationSeconds: number;
  sizeBytes: number;
};

type CreateFileResult = {
  fileId: string;
  uploadUrl: string;
};

type ConfirmUploadResult = {
  fileId: string;
  status: string;
};

export function useFilesApi(): {
  createFile: (params: CreateFileParams) => Promise<CreateFileResult>;
  confirmUpload: (fileId: string) => Promise<ConfirmUploadResult>;
} {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';

  const getToken = () => localStorage.getItem('ismart.accessToken') ?? '';

  const createFile = async (params: CreateFileParams): Promise<CreateFileResult> => {
    const res = await fetch(`${apiUrl}/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`Create file failed: ${res.status} ${res.statusText}`);
    return res.json() as Promise<CreateFileResult>;
  };

  const confirmUpload = async (fileId: string): Promise<ConfirmUploadResult> => {
    const res = await fetch(`${apiUrl}/files/${fileId}/upload-complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error(`Confirm upload failed: ${res.status} ${res.statusText}`);
    return res.json() as Promise<ConfirmUploadResult>;
  };

  return { createFile, confirmUpload };
}
