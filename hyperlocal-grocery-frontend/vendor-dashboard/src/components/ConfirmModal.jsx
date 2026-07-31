import React from "react";

function ConfirmModal({ isOpen, title, message, confirmText = "Confirm", cancelText = "Cancel", onConfirm, onCancel, type = "danger" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full border shadow-xl space-y-4 text-left">
        <div>
          <h3 className="font-extrabold text-sm text-gray-800 uppercase tracking-wider">
            {type === "danger" ? "⚠️ " : "ℹ️ "}{title}
          </h3>
          <p className="text-xs text-gray-550 leading-relaxed font-semibold mt-2">
            {message}
          </p>
        </div>

        <div className="flex gap-3 justify-end pt-2 text-[10px] font-black uppercase tracking-wider">
          <button
            onClick={onCancel}
            className="bg-white hover:bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl border border-gray-250 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2.5 rounded-xl text-white transition ${
              type === "danger"
                ? "bg-red-600 hover:bg-red-750"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
