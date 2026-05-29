import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Button, Card, EmptyState, Input, FileUpload } from '@/components/ui'
import { FileText, Upload } from 'lucide-react'

export const Route = createFileRoute('/(admin)/documents/')({
  component: DocumentsPage,
})

function DocumentsPage() {
  const [search, setSearch] = useState('')
  const [showUpload, setShowUpload] = useState(false)

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-2">Manage system documents (berkas)</p>
        </div>
        <Button onClick={() => setShowUpload(!showUpload)} className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {showUpload && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Upload New Document</h3>
          <FileUpload
            accept="*"
            onFileSelect={(files) => {
              // Handle file upload
              console.log('Files selected:', files)
              setShowUpload(false)
            }}
          />
        </Card>
      )}

      <Card className="p-4">
        <Input
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </Card>

      <Card className="p-8">
        <EmptyState
          icon={FileText}
          title="No documents found"
          description="Upload your first document to get started"
        />
      </Card>
    </div>
  )
}
