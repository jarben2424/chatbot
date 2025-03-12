'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { IconFile, IconX } from '@/components/ui/icons'
import { toast } from 'sonner'

interface AttachmentButtonProps {
  attachments: any[]
  setAttachments: (files: any[]) => void
}

export function AttachmentButton({
  attachments,
  setAttachments
}: AttachmentButtonProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    const newFiles = Array.from(files)
    const validFiles = newFiles.filter(file => file.size <= 10 * 1024 * 1024) // 10MB limit
    
    if (validFiles.length !== newFiles.length) {
      toast.error('Files must be smaller than 10MB')
    }
    
    setAttachments([...attachments, ...validFiles])
    e.target.value = '' // Reset input
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (!files?.length) return
    
    const newFiles = Array.from(files)
    const validFiles = newFiles.filter(file => file.size <= 10 * 1024 * 1024) // 10MB limit
    
    if (validFiles.length !== newFiles.length) {
      toast.error('Files must be smaller than 10MB')
    }
    
    setAttachments([...attachments, ...validFiles])
  }

  return (
    <div className="flex items-center">
      <div className="relative">
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
          multiple
        />
        <Button
          variant="outline"
          size="icon"
          className={`${isDragging ? 'bg-primary/10' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <IconFile />
          <span className="sr-only">Attach files</span>
        </Button>
      </div>
      
      {attachments.length > 0 && (
        <div className="flex ml-2 gap-1">
          {attachments.map((file, index) => (
            <div key={index} className="flex items-center bg-muted rounded px-2 py-1 text-xs">
              <span className="truncate max-w-[100px]">{file.name}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-4 w-4 ml-1"
                onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
              >
                <IconX className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 