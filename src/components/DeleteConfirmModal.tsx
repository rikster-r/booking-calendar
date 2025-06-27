import Modal from '@/components/Modal';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning';
};

const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Подтвердите удаление',
  message = 'Вы уверены, что хотите удалить этот элемент? Это действие нельзя будет отменить.',
  confirmText = 'Удалить',
  cancelText = 'Отмена',
  isLoading = false,
  variant = 'danger',
}: Props) => {
  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const variantStyles = {
    danger: {
      icon: 'text-red-500',
      confirmButton:
        'text-white bg-red-500 hover:bg-red-600 focus-visible:ring-red-300',
    },
    warning: {
      icon: 'text-orange-500',
      confirmButton:
        'text-white bg-orange-400 hover:bg-orange-500 focus-visible:ring-orange-300',
    },
  };

  const styles = variantStyles[variant];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[400px]">
      <div className="bg-white p-6 sm:p-7">
        <div className="flex items-start mb-4 gap-3">
          <ExclamationTriangleIcon className={`w-6 h-6 mt-1 ${styles.icon}`} />
          <div className="flex-1">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>
          <button
            className="hover:cursor-pointer"
            onClick={handleClose}
            disabled={isLoading}
          >
            <XMarkIcon className="w-6 sm:w-7 h-6 sm:h-7 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm sm:text-base text-gray-700">{message}</p>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            className="focus:outline-none text-gray-500 hover:text-gray-700 focus-visible:ring-4 focus-visible:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            className={`focus:outline-none ${styles.confirmButton} focus-visible:ring-4 font-medium rounded-lg text-sm px-5 py-2.5 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading && (
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmModal;
