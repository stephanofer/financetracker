import { Spinner } from "@/components/ui/spinner";
import {
  useTransaction
} from "@/dashboard/hooks/useMainDetails";
import { ArrowLeft, Calendar, FileText, Image, Receipt } from "lucide-react";
import { useNavigate, useParams } from "react-router";

export function TransactionDetailContainer() {
  const navigate = useNavigate();

  const { id, from } = useParams();

  const { data, isPending } = useTransaction(Number(id));

  const transaction = data?.data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-PE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const handleBack = () => {
    if (from === "transactions") {
      navigate("/transactions");
    } else {
      navigate("/dashboard");
    }
  };

  const getFileIcon = (fileType: string | null) => {
    switch (fileType) {
      case "image":
      case "receipt":
        return <Image className="w-5 h-5" />;
      case "pdf":
      case "document":
        return <FileText className="w-5 h-5" />;
      default:
        return <Receipt className="w-5 h-5" />;
    }
  };

  if (isPending) {
    return (
      <div className="flex flex-col h-full bg-[#093030] items-center justify-center">
        <Spinner className="w-12 h-12 text-[#F1FFF3]" />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex flex-col h-full bg-[#093030]">
        <header className="px-6 pt-8 pb-6">
          <button
            onClick={handleBack}
            className="bg-[#DFF7E2] backdrop-blur-sm rounded-full p-2"
          >
            <ArrowLeft className="w-6 h-6 text-black" />
          </button>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[#F1FFF3]/60">Transaction not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#093030]">
      {/* Header */}
      <header className="px-6 pt-8 pb-6 bg-gradient-to-b from-[#00352F] to-[#093030]">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBack}
            className="bg-[#DFF7E2] backdrop-blur-sm rounded-full p-2 hover:bg-[#C5E8C9] transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-black" />
          </button>
          <h1 className="text-2xl font-bold text-[#F1FFF3]">
            Transaction Details
          </h1>
        </div>

        {/* Amount Card */}
        <div className="bg-gradient-to-br from-[#00D09E] to-[#00B589] rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div
                className="rounded-xl p-3 bg-white/20 backdrop-blur-sm"
                style={{
                  backgroundColor: transaction.category_color
                    ? `${transaction.category_color}40`
                    : "rgba(255, 255, 255, 0.2)",
                }}
              >
                <span className="text-2xl">
                  {transaction.category_icon || "💰"}
                </span>
              </div>
              <div>
                <p className="text-white/90 text-sm font-medium">
                  {transaction.type === "expense" ? "Expense" : "Income"}
                </p>
                <p className="text-white font-bold text-lg">
                  {transaction.category_name || "Uncategorized"}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <p
              className={`text-4xl font-bold ${
                transaction.type === "expense" ? "text-[#FF6B6B]" : "text-white"
              }`}
            >
              {transaction.type === "expense" ? "-" : "+"}
              {formatCurrency(transaction.amount)}
            </p>
          </div>
        </div>
      </header>

      {/* Details */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-4">
          {/* Description */}
          {transaction.description && (
            <div className="bg-[#0A3A3A] rounded-xl p-4">
              <p className="text-[#F1FFF3]/60 text-xs font-medium mb-2">
                DESCRIPTION
              </p>
              <p className="text-[#F1FFF3] text-base">
                {transaction.description}
              </p>
            </div>
          )}

          {/* Date */}
          <div className="bg-[#0A3A3A] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="bg-[#00D09E]/20 rounded-lg p-2">
                <Calendar className="w-5 h-5 text-[#00D09E]" />
              </div>
              <div className="flex-1">
                <p className="text-[#F1FFF3]/60 text-xs font-medium mb-1">
                  DATE
                </p>
                <p className="text-[#F1FFF3] text-sm">
                  {formatDate(transaction.transaction_date)}
                </p>
              </div>
            </div>
          </div>

          {/* Category & Subcategory */}
          <div className="bg-[#0A3A3A] rounded-xl p-4">
            <p className="text-[#F1FFF3]/60 text-xs font-medium mb-3">
              CATEGORY
            </p>
            <div className="flex items-center gap-2">
              <span className="bg-[#00D09E]/20 text-[#00D09E] px-3 py-1.5 rounded-lg text-sm font-medium">
                {transaction.category_name || "Uncategorized"}
              </span>
              {transaction.subcategory_name && (
                <>
                  <span className="text-[#F1FFF3]/40">→</span>
                  <span className="bg-[#3299FF]/20 text-[#3299FF] px-3 py-1.5 rounded-lg text-sm font-medium">
                    {transaction.subcategory_name}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Account */}
          {transaction.account_name && (
            <div className="bg-[#0A3A3A] rounded-xl p-4">
              <p className="text-[#F1FFF3]/60 text-xs font-medium mb-2">
                ACCOUNT
              </p>
              <p className="text-[#F1FFF3] text-base">
                {transaction.account_name}
                {transaction.account_type && (
                  <span className="text-[#F1FFF3]/60 text-sm ml-2">
                    ({transaction.account_type})
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Notes */}
          {transaction.notes && (
            <div className="bg-[#0A3A3A] rounded-xl p-4">
              <p className="text-[#F1FFF3]/60 text-xs font-medium mb-2">
                NOTES
              </p>
              <p className="text-[#F1FFF3] text-sm leading-relaxed">
                {transaction.notes}
              </p>
            </div>
          )}

          {/* Attachments / Vouchers */}
          {transaction.attachments && transaction.attachments.length > 0 && (
            <div className="bg-[#0A3A3A] rounded-xl p-4">
              <p className="text-[#F1FFF3]/60 text-xs font-medium mb-3">
                VOUCHERS & ATTACHMENTS
              </p>
              <div className="space-y-3">
                {transaction.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="bg-[#093030] rounded-lg p-3 border border-[#00D09E]/20"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-[#00D09E]/20 rounded-lg p-2 flex-shrink-0">
                        {getFileIcon(attachment.file_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#F1FFF3] text-sm font-medium truncate">
                          {attachment.original_file_name ||
                            attachment.file_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[#F1FFF3]/60 text-xs">
                            {formatFileSize(attachment.file_size)}
                          </p>
                          {attachment.file_type && (
                            <>
                              <span className="text-[#F1FFF3]/40">•</span>
                              <p className="text-[#F1FFF3]/60 text-xs uppercase">
                                {attachment.file_type}
                              </p>
                            </>
                          )}
                        </div>
                        {attachment.description && (
                          <p className="text-[#F1FFF3]/70 text-xs mt-1">
                            {attachment.description}
                          </p>
                        )}
                      </div>
                      {attachment.r2_url && (
                        <a
                          href={attachment.r2_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#00D09E] hover:bg-[#00B589] text-[#093030] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0"
                        >
                          View
                        </a>
                      )}
                    </div>
                    {attachment.file_type === "image" && attachment.r2_url && (
                      <div className="mt-3 rounded-lg overflow-hidden">
                        <img
                          src={attachment.r2_url}
                          alt={attachment.original_file_name || "Voucher image"}
                          className="w-full h-auto"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Created At */}
          <div className="bg-[#0A3A3A]/50 rounded-xl p-4">
            <p className="text-[#F1FFF3]/40 text-xs">
              Created: {formatDate(transaction.created_at)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
