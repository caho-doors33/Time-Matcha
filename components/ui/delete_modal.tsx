import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ConfirmDeleteModalProps {
    open: boolean
    onClose: () => void
    onConfirm: () => void
    title?: string
    description?: string
    confirmText?: string
    cancelText?: string
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    open,
    onClose,
    onConfirm,
    title = "本当に削除しますか？",
    description = "この操作は取り消せません。他のユーザーの回答もすべて削除されます。",
    confirmText = "削除する",
    cancelText = "キャンセル"
}) => {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-[#666] mb-4">{description}</p>
                <DialogFooter className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>{cancelText}</Button>
                    <Button variant="destructive" onClick={onConfirm}>{confirmText}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default ConfirmDeleteModal
