'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical, Trash2, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmationModal } from './confirmation-modal';

interface Action {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  colorClass?: string;
}

interface ActionMenuProps {
  actions: Action[];
  entityId: string;
  editPath?: string; // e.g., '/dashboard/school-admin/students'
  onDelete: (id: string) => Promise<void>;
}

export function ActionMenu({ actions, entityId, editPath, onDelete }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleEdit = () => {
    if (editPath) {
      router.push(`${editPath}/edit/${entityId}`);
    } else {
      console.warn('ActionMenu: editPath is not provided.');
    }
  };

  const handleDelete = () => {
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(entityId);
    } catch (error) {
      console.error("Failed to delete item:", error);
      // Optionally show an error toast/message
    } finally {
      setIsDeleting(false);
      setIsModalOpen(false);
    }
  };

  const standardActions = [
    {
      label: 'Edit',
      onClick: handleEdit,
      icon: <Pencil size={16} />,
    },
    {
      label: 'Delete',
      onClick: handleDelete,
      icon: <Trash2 size={16} />,
      colorClass: 'text-red-500',
    },
  ];

  const menuActions = [...actions, ...standardActions];

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button onClick={toggleMenu} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <MoreVertical size={20} />
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700"
            >
              <ul>
                {menuActions.map((action, index) => (
                  <li key={index}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        action.onClick();
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center hover:bg-gray-100 dark:hover:bg-gray-800 ${action.colorClass || 'text-gray-700 dark:text-gray-200'}`}
                    >
                      {action.icon && <span className="mr-2">{action.icon}</span>}
                      {action.label}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this item? This action cannot be undone."
        isLoading={isDeleting}
      />
    </>
  );
}

