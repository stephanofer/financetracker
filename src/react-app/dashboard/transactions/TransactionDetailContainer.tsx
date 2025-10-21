import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTransaction } from "../hooks/useMainDetails";
import { useDeleteTransaction } from "../hooks/useTransactions";
import type { Attachment } from "../types";
import { formatCurrency, formatDate, formatFileSize } from "../utils";

export function TransactionDetailContainer() {
  const { id } = useParams();
  const { data, isPending } = useTransaction(Number(id));
  const { mutate } = useDeleteTransaction();
  const transaction = data?.data;
  const [selectedImage, setSelectedImage] = useState<Attachment | null>(null);

  const navigate = useNavigate()

  const handleBack = () => {
    window.history.back();
  };

  const voucherImage = transaction?.attachments?.find(
    (att) => att.file_type === "image"
  );

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0F1F1F] text-white gap-4">
        <Spinner className="size-8" />
        <span className="text-lg">Cargando transacción...</span>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0F1F1F] text-white">
        <span className="text-lg">No se encontró la transacción.</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-screen bg-[#0F1F1F] text-white">
        {/* Header */}
        <header className="px-4 pt-6 pb-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="p-2.5 hover:bg-red-500/20 rounded-full transition-colors bg-red-500/10">
                <Trash2 className="w-6 h-6 text-red-400" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this transaction and all its data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                  mutate(id!);
                  navigate("/")
                }}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-24">
          {/* Category Icon */}
          <div className="flex justify-center mb-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: `${transaction.category_color}20`,
              }}
            >
              <span className="text-4xl">{transaction.category_icon}</span>
            </div>
          </div>

          {/* Category Name */}
          <h1 className="text-2xl font-semibold text-center mb-2">
            {transaction.category_name}
          </h1>

          {/* Amount - PRIORIDAD 1 */}
          <div className="text-center mb-2">
            <p className="text-4xl font-bold">
              {transaction.type === "expense" ? "-" : "+"}
              {formatCurrency(transaction.amount)}
            </p>
          </div>

          {/* Date - PRIORIDAD 2 */}
          <p className="text-center text-gray-400 text-sm mb-8">
            {formatDate(transaction.transaction_date)}
          </p>

          {/* Description - PRIORIDAD 3 (si existe) */}
          {transaction.description && (
            <div className="bg-[#1A2F2F] rounded-2xl p-4 mb-4">
              <p className="text-xs text-gray-400 mb-2">DESCRIPTION</p>
              <p className="text-sm">{transaction.description}</p>
            </div>
          )}

          {/* Account - PRIORIDAD 4 */}
          <div className="bg-[#1A2F2F] rounded-2xl p-4 mb-4">
            <p className="text-xs text-gray-400 mb-2">ACCOUNT</p>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{transaction.account_name}</p>
              <span className="px-2 py-1 bg-white/5 text-xs text-gray-400 rounded-md uppercase">
                {transaction.account_type}
              </span>
            </div>
          </div>

          {/* Category & Subcategory - PRIORIDAD 5 */}
          <div className="bg-[#1A2F2F] rounded-2xl p-4 mb-4">
            <p className="text-xs text-gray-400 mb-3">CATEGORY</p>
            <div className="flex items-center gap-2">
              <span
                className="px-3 py-1.5 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: `${transaction.category_color}20`,
                  color: transaction.category_color,
                }}
              >
                {transaction.category_name}
              </span>
              {transaction.subcategory_name && (
                <>
                  <span className="text-gray-500">→</span>
                  <span className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium">
                    {transaction.subcategory_name}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Voucher Preview - PRIORIDAD 6 */}
          {voucherImage && (
            <div className="bg-[#1A2F2F] rounded-2xl p-4 mb-4">
              <p className="text-xs text-gray-400 mb-3">VOUCHER</p>
              <button
                onClick={() => setSelectedImage(voucherImage)}
                className="w-full group relative"
              >
                {/* Voucher-style frame */}
                <div className="relative overflow-hidden rounded-lg border-2 border-dashed border-white/20 hover:border-white/40 transition-colors">
                  {/* Perforation effect top */}
                  <div className="absolute top-0 left-0 right-0 h-3 bg-[#0F1F1F] flex justify-around items-center z-10">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-[#1A2F2F]"
                      />
                    ))}
                  </div>

                  {/* Image */}
                  <img
                    src={voucherImage.r2_url || undefined}
                    alt="Voucher"
                    className="w-full h-auto mt-3"
                  />

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-lg transition-opacity">
                      Tap to enlarge
                    </span>
                  </div>
                </div>
              </button>

              {/* Voucher info */}
              {voucherImage.description && (
                <p className="text-xs text-gray-400 mt-2">
                  {voucherImage.description}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {formatFileSize(voucherImage.file_size ?? 0)} •{" "}
                {voucherImage.mime_type}
              </p>
            </div>
          )}

          {/* Notes - PRIORIDAD 7 */}
          {transaction.notes && (
            <div className="bg-[#1A2F2F] rounded-2xl p-4 mb-4">
              <p className="text-xs text-gray-400 mb-2">NOTES</p>
              <p className="text-sm leading-relaxed text-gray-300">
                {transaction.notes}
              </p>
            </div>
          )}

          {/* Other Attachments - PRIORIDAD 8 */}
          {transaction.attachments && transaction.attachments.length > 1 && (
            <div className="bg-[#1A2F2F] rounded-2xl p-4 mb-4">
              <p className="text-xs text-gray-400 mb-3">OTHER FILES</p>
              <div className="space-y-2">
                {transaction.attachments
                  .filter((att) => att.file_type !== "image")
                  .map((attachment) => (
                    <div
                      key={attachment.id}
                      className="bg-[#0F1F1F] rounded-lg p-3 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">📄</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">
                          {attachment.original_file_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(attachment.file_size ?? 0)}
                        </p>
                      </div>
                      <a
                        href={attachment.r2_url || undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 flex-shrink-0"
                      >
                        View
                      </a>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Created At - PRIORIDAD 9 */}
          <div className="mt-4 text-center pb-4">
            <p className="text-xs text-gray-500">
              Created: {formatDate(transaction.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <div className="max-w-4xl w-full max-h-full overflow-auto">
            <img
              src={selectedImage.r2_url || undefined}
              alt="Voucher enlarged"
              className="w-full h-auto rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            {selectedImage.description && (
              <p className="text-white text-center mt-4">
                {selectedImage.description}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
