import { Dialog, DialogPanel, DialogBackdrop } from '@headlessui/react';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  return (
    <Dialog open={isOpen} as="div" className="relative z-50" onClose={onClose}>
      <DialogBackdrop className="fixed inset-0 bg-gray-900/60" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="bg-white rounded-lg shadow-lg p-6 max-h-[90%] overflow-auto">
          {children}
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default Modal;
