import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import {
  ArrowLeft,
  Trash2,
  X,
  Calendar,
  Wallet,
  Tag,
  FileText,
  Image as ImageIcon,
  Paperclip,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTransaction } from "../hooks/useMainDetails";
import { useDeleteTransaction } from "../hooks/useTransactions";
import type { Attachment } from "../utils/types";
import { formatCurrency, formatDate, formatFileSize } from "../utils/utils";

export function TransactionDetailContainer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isPending } = useTransaction(Number(id));
  const { mutate } = useDeleteTransaction();
  const transaction = data?.data;
  const [selectedImage, setSelectedImage] = useState<Attachment | null>(null);

  const handleBack = () => {
    window.history.back();
  };

  const voucherImage = transaction?.attachments?.find(
    (att) => att.file_type === "image"
  );

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white gap-4">
        <Spinner className="size-8" />
        <span className="text-lg text-slate-300">Cargando transacción...</span>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="text-center">
          <div className="w-20 h-20 bg-slate-800/50 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">❌</span>
          </div>
          <span className="text-lg text-slate-300">
            No se encontró la transacción.
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
        {/* Animated background orb */}
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse"
          style={{ backgroundColor: transaction.category_color ?? "#64748b" }}
        />

        {/* Header */}
        <header className="relative z-10 px-6 pt-8 pb-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="p-3 hover:bg-white/10 rounded-2xl transition-all active:scale-95 bg-white/5 backdrop-blur-sm border border-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="p-3 hover:bg-red-500/30 rounded-2xl transition-all active:scale-95 bg-red-500/20 backdrop-blur-sm border border-red-500/30">
                <Trash2 className="w-5 h-5 text-red-400" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  this transaction and all its data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    mutate(id!);
                    navigate("/");
                  }}
                >
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </header>

        {/* Main Content */}
        <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-24">
          {/* Category Icon with gradient background */}
          <div className="flex justify-center mb-6">
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden"
              style={{
                backgroundColor: `${transaction.category_color ?? "#64748b"}30`,
                border: `2px solid ${
                  transaction.category_color ?? "#64748b"
                }50`,
              }}
            >
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundColor: transaction.category_color ?? "#64748b",
                }}
              />
              <span className="text-5xl relative z-10">
                {transaction.category_icon}
              </span>
            </div>
          </div>

          {/* Category Name */}
          <h1 className="text-3xl font-bold text-center mb-3 text-white">
            {transaction.category_name}
          </h1>

          {/* Amount - Enhanced with gradient */}
          <div className="text-center mb-2">
            <p
              className={`text-5xl font-bold ${
                transaction.type === "expense"
                  ? "text-red-400"
                  : "text-emerald-400"
              }`}
            >
              {transaction.type === "expense" ? "-" : "+"}
              {formatCurrency(transaction.amount)}
            </p>
          </div>

          {/* Date with icon */}
          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-8">
            <Calendar className="w-4 h-4" />
            <p>{formatDate(transaction.transaction_date)}</p>
          </div>

          {/* Description */}
          {transaction.description && (
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-5 mb-4 border border-white/10 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-slate-400" />
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Description
                </p>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                {transaction.description}
              </p>
            </div>
          )}

          {/* Account */}
          {transaction.account_type && (
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-5 mb-4 border border-white/10 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-4 h-4 text-slate-400" />
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Account
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">
                  {transaction.account_name}
                </p>
                <span className="px-3 py-1.5 bg-white/10 text-xs text-slate-300 rounded-xl uppercase font-medium border border-white/10">
                  {transaction.account_type}
                </span>
              </div>
            </div>
          )}

          {/* Category & Subcategory */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-5 mb-4 border border-white/10 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-slate-400" />
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Category
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="px-4 py-2 rounded-xl text-sm font-semibold shadow-lg"
                style={{
                  backgroundColor: `${
                    transaction.category_color ?? "#64748b"
                  }30`,
                  color: transaction.category_color ?? "#64748b",
                  border: `2px solid ${
                    transaction.category_color ?? "#64748b"
                  }50`,
                }}
              >
                {transaction.category_name}
              </span>
              {transaction.subcategory_name && (
                <>
                  <span className="text-slate-500 text-lg">→</span>
                  <span className="px-4 py-2 bg-blue-500/30 text-blue-400 rounded-xl text-sm font-semibold border-2 border-blue-500/50 shadow-lg">
                    {transaction.subcategory_name}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Voucher Preview - Enhanced */}
          {voucherImage && (
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-5 mb-4 border border-white/10 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon className="w-4 h-4 text-slate-400" />
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Voucher
                </p>
              </div>
              <button
                onClick={() => setSelectedImage(voucherImage)}
                className="w-full group relative"
              >
                <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 transition-all duration-300 shadow-lg hover:shadow-2xl">
                  {/* Perforation effect */}
                  <div className="absolute top-0 left-0 right-0 h-4 bg-slate-900 flex justify-around items-center z-10">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-slate-800"
                      />
                    ))}
                  </div>

                  {/* Image */}
                  <img
                    src={voucherImage.r2_url || undefined}
                    alt="Voucher"
                    className="w-full h-auto mt-4 transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-semibold bg-black/70 px-5 py-2.5 rounded-xl transition-opacity backdrop-blur-sm">
                      Tap to enlarge
                    </span>
                  </div>
                </div>
              </button>

              {/* Voucher info */}
              {voucherImage.description && (
                <p className="text-xs text-slate-400 mt-3">
                  {voucherImage.description}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                <span>{formatFileSize(voucherImage.file_size ?? 0)}</span>
                <span>•</span>
                <span>{voucherImage.mime_type}</span>
              </p>
            </div>
          )}

          {/* Notes */}
          {transaction.notes && (
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-5 mb-4 border border-white/10 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-slate-400" />
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Notes
                </p>
              </div>
              <p className="text-sm leading-relaxed text-slate-200">
                {transaction.notes}
              </p>
            </div>
          )}

          {/* Other Attachments */}
          {transaction.attachments && transaction.attachments.length > 1 && (
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-5 mb-4 border border-white/10 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <Paperclip className="w-4 h-4 text-slate-400" />
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Other Files
                </p>
              </div>
              <div className="space-y-2">
                {transaction.attachments
                  .filter((att) => att.file_type !== "image")
                  .map((attachment) => (
                    <div
                      key={attachment.id}
                      className="bg-slate-900/50 rounded-xl p-4 flex items-center gap-3 hover:bg-slate-900/70 transition-all border border-white/5"
                    >
                      <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">📄</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate text-white font-medium">
                          {attachment.original_file_name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatFileSize(attachment.file_size ?? 0)}
                        </p>
                      </div>
                      <a
                        href={attachment.r2_url || undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 flex-shrink-0 font-semibold px-3 py-1.5 bg-blue-500/20 rounded-lg hover:bg-blue-500/30 transition-all"
                      >
                        View
                      </a>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Created At */}
          <div className="mt-6 text-center pb-4">
            <p className="text-xs text-slate-500 flex items-center justify-center gap-2">
              <Calendar className="w-3 h-3" />
              <span>Created: {formatDate(transaction.created_at)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Image Modal - Enhanced */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all active:scale-95 backdrop-blur-sm border border-white/20"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <div className="max-w-4xl w-full max-h-full overflow-auto">
            <img
              src={selectedImage.r2_url || undefined}
              alt="Voucher enlarged"
              className="w-full h-auto rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            {selectedImage.description && (
              <p className="text-white text-center mt-6 text-lg bg-black/50 backdrop-blur-sm px-6 py-3 rounded-xl inline-block">
                {selectedImage.description}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
