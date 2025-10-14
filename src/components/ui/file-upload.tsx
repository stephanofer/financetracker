import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  maxSizeMB?: number;
}

export function FileUpload({
  onFileSelect,
  accept = "image/jpeg,image/jpg,image/png,image/webp,application/pdf",
  maxSizeMB = 5,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) {
      setFile(null);
      setPreview(null);
      onFileSelect(null);
      return;
    }

    // Validar tamaño
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (selectedFile.size > maxSizeBytes) {
      setError(`El archivo debe pesar menos de ${maxSizeMB}MB`);
      setFile(null);
      setPreview(null);
      onFileSelect(null);
      return;
    }

    // Validar tipo
    const allowedTypes = accept.split(",");
    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Tipo de archivo no permitido. Solo se aceptan imágenes o PDF");
      setFile(null);
      setPreview(null);
      onFileSelect(null);
      return;
    }

    setError(null);
    setFile(selectedFile);
    onFileSelect(selectedFile);

    // Generar preview para imágenes
    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    onFileSelect(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="file-upload">Adjuntar archivo (opcional)</Label>
        <Input
          id="file-upload"
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="mt-2"
        />
        <p className="text-sm text-muted-foreground mt-1">
          Imágenes (JPEG, PNG, WebP) o PDF. Máximo {maxSizeMB}MB.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {file && (
        <div className="p-4 border rounded-md space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-medium text-sm">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-destructive hover:text-destructive"
            >
              ✕ Eliminar
            </Button>
          </div>

          {preview && (
            <div className="mt-3">
              <img
                src={preview}
                alt="Preview"
                className="max-w-full h-auto max-h-48 rounded-md object-contain"
              />
            </div>
          )}

          {file.type === "application/pdf" && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <svg
                className="w-12 h-12"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm">Documento PDF</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
