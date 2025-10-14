import { Check, FileText, ImageIcon, Upload, X } from "lucide-react";
import { useState } from "react";

interface FileUploadProps {
  value: FileList | null;
  onChange: (files: FileList | null) => void;
  fieldProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export function FileUpload({ value, onChange, fieldProps }: FileUploadProps) {
  const [filePreview, setFilePreview] = useState<string | null>(null);

  return (
    <div className="relative w-full min-w-0">
      <input
        {...fieldProps}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
        onChange={(e) => {
          const files = e.target.files;
          onChange(files);

          // Generar vista previa
          if (files && files[0]) {
            const file = files[0];
            if (file.type.startsWith("image/")) {
              const reader = new FileReader();
              reader.onloadend = () => {
                setFilePreview(reader.result as string);
              };
              reader.readAsDataURL(file);
            } else {
              setFilePreview(null);
            }
          } else {
            setFilePreview(null);
          }
        }}
        className="hidden"
        id="file-upload"
      />

      {!value || !value[0] ? (
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center gap-3 w-full min-w-0 px-6 py-8 bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-900/40 border-2 border-dashed border-slate-600/40 rounded-2xl hover:border-emerald-500/60 hover:from-emerald-950/30 hover:via-slate-800/30 hover:to-emerald-900/20 cursor-pointer transition-all duration-300 group backdrop-blur-sm"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full group-hover:bg-emerald-400/30 transition-all duration-300"></div>
            <div className="relative p-4 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-2xl group-hover:from-emerald-500/20 group-hover:to-emerald-600/10 transition-all duration-300 border border-slate-600/30 group-hover:border-emerald-500/40">
              <Upload
                className="w-8 h-8 text-slate-400 group-hover:text-emerald-400 transition-all duration-300 group-hover:scale-110"
                strokeWidth={2}
              />
            </div>
          </div>

          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">
              Arrastra tu archivo o haz clic
            </p>
            <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
              JPG, PNG, WEBP o PDF hasta 5MB
            </p>
          </div>
        </label>
      ) : (
        <div className="space-y-3">
          {/* Vista previa de imagen */}
          {value[0].type.startsWith("image/") && filePreview && (
            <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-slate-900/50 border-2 border-emerald-500/30 group/preview">
              <img
                src={filePreview}
                alt="Vista previa"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>

              {/* Badge de éxito */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/90 backdrop-blur-sm rounded-full">
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                <span className="text-xs font-semibold text-white">Listo</span>
              </div>

              {/* Información del archivo */}
              <div className="absolute bottom-3 left-3 right-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="p-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                      <ImageIcon
                        className="w-4 h-4 text-white"
                        strokeWidth={2}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">
                        {value[0].name}
                      </p>
                      <p className="text-xs text-slate-300">
                        {(value[0].size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onChange(null);
                      setFilePreview(null);
                      const input = document.getElementById(
                        "file-upload"
                      ) as HTMLInputElement;
                      if (input) input.value = "";
                    }}
                    className="flex-shrink-0 p-2 bg-red-500/90 hover:bg-red-500 backdrop-blur-sm rounded-lg transition-all duration-200 border border-red-400/30 hover:border-red-400/50 group/btn hover:scale-105 active:scale-95"
                    title="Eliminar archivo"
                  >
                    <X className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Vista previa de PDF */}
          {value[0].type === "application/pdf" && (
            <div className="relative w-full p-4 rounded-2xl bg-gradient-to-br from-slate-800/60 via-slate-800/40 to-slate-900/60 border-2 border-emerald-500/30 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500/20 blur-lg rounded-xl"></div>
                    <div className="relative p-3 bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-xl border border-red-500/30">
                      <FileText
                        className="w-8 h-8 text-red-400"
                        strokeWidth={2}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-slate-200 truncate">
                          {value[0].name}
                        </p>
                        <div className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                          <Check
                            className="w-3 h-3 text-emerald-400"
                            strokeWidth={3}
                          />
                          <span className="text-xs font-medium text-emerald-400">
                            PDF
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">
                        {(value[0].size / 1024).toFixed(1)} KB • Documento PDF
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        onChange(null);
                        setFilePreview(null);
                        const input = document.getElementById(
                          "file-upload"
                        ) as HTMLInputElement;
                        if (input) input.value = "";
                      }}
                      className="flex-shrink-0 p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-all duration-200 border border-red-500/30 hover:border-red-500/50 group/btn hover:scale-105 active:scale-95"
                      title="Eliminar archivo"
                    >
                      <X
                        className="w-4 h-4 text-red-400 group-hover/btn:text-red-300"
                        strokeWidth={2.5}
                      />
                    </button>
                  </div>

                  {/* Barra de progreso visual */}
                  <div className="h-1 bg-slate-700/50 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-gradient-to-r from-emerald-500 to-emerald-400 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
