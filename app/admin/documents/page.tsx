"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CATEGORY_SUBFOLDERS } from "@/lib/hcga-constants"

interface Document {
  id: number
  name: string
  driveId: string
  category: string
  subfolder?: string
  size?: string
  uploadedAt: string
  createdAt: string
}

const CATEGORIES = [
  { value: "induksi-karyawan", label: "INDUKSI KARYAWAN" },
  { value: "form", label: "FORM" },
  { value: "sop-ik", label: "SOP - IK" },
  { value: "bisnis-proses-so", label: "BISNIS PROSES & SO" },
  { value: "internal-memo", label: "INTERNAL MEMO" },
  { value: "sk", label: "SURAT KEPUTUSAN ( UMUM )" },
]

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    driveId: "",
    category: "",
    subfolder: "",
    size: "",
  })

  useEffect(() => {
    fetchDocuments()
  }, [filterCategory])

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const url = filterCategory === "all" ? "/api/admin/documents" : `/api/admin/documents?category=${filterCategory}`

      const response = await fetch(url)
      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingDocument ? "/api/admin/documents" : "/api/admin/documents"
      const method = editingDocument ? "PUT" : "POST"

      const payload = editingDocument ? { ...formData, id: editingDocument.id } : formData

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save document")
      }

      toast({
        title: "Success",
        description: `Document ${editingDocument ? "updated" : "created"} successfully`,
      })

      setIsDialogOpen(false)
      resetForm()
      fetchDocuments()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save document",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this document?")) return

    try {
      const response = await fetch(`/api/admin/documents?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete document")

      toast({
        title: "Success",
        description: "Document deleted successfully",
      })
      fetchDocuments()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({ name: "", driveId: "", category: "", subfolder: "", size: "" })
    setEditingDocument(null)
  }

  const openCreateDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const openEditDialog = (doc: Document) => {
    setEditingDocument(doc)
    setFormData({
      name: doc.name,
      driveId: doc.driveId,
      category: doc.category,
      subfolder: doc.subfolder || "",
      size: doc.size || "",
    })
    setIsDialogOpen(true)
  }

  const getCategoryLabel = (value: string) => {
    return CATEGORIES.find((cat) => cat.value === value)?.label || value
  }

  const availableSubfolders = formData.category ? CATEGORY_SUBFOLDERS[formData.category] || [] : []

  return (
    <div className="container mx-auto py-6 sm:py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Document Management</h1>
          <p className="text-muted-foreground text-sm">Manage HCGA IMS documents</p>
        </div>
        <Button onClick={openCreateDialog} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Document
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Filter Documents</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Filter documents by category</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full md:w-[300px] text-sm">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-8">Loading documents...</div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No documents found. Click "Add Document" to create one.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex-1 w-full">
                    <h3 className="font-semibold text-base sm:text-lg mb-1">{doc.name}</h3>
                    <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                      <span className="font-medium">{getCategoryLabel(doc.category)}</span>
                      {doc.subfolder && <span className="text-xs bg-muted px-2 py-1 rounded">{doc.subfolder}</span>}
                      {doc.size && <span>{doc.size}</span>}
                      <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 break-all">
                      Drive ID: {doc.driveId}
                    </p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://drive.google.com/file/d/${doc.driveId}/view`, "_blank")}
                      className="flex-1 sm:flex-initial"
                    >
                      <ExternalLink className="w-4 h-4 sm:mr-2" />
                      <span className="sm:inline hidden">View</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(doc)}
                      className="flex-1 sm:flex-initial"
                    >
                      <Pencil className="w-4 h-4 sm:mr-2" />
                      <span className="sm:inline hidden">Edit</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      className="flex-1 sm:flex-initial"
                    >
                      <Trash2 className="w-4 h-4 sm:mr-2" />
                      <span className="sm:inline hidden">Delete</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                {editingDocument ? "Edit Document" : "Add New Document"}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {editingDocument ? "Update document information" : "Add a new document from Google Drive"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-sm">
                  Document Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., SK - GSM - 111..."
                  required
                  className="text-sm"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="driveId" className="text-sm">
                  Google Drive ID
                </Label>
                <Input
                  id="driveId"
                  value={formData.driveId}
                  onChange={(e) => setFormData({ ...formData, driveId: e.target.value })}
                  placeholder="e.g., 1aklY4tO7p5UhFoUYF2PSOP6VfL55Fdug"
                  required
                  className="text-sm"
                />
                <p className="text-[10px] sm:text-xs text-muted-foreground">Extract ID from Google Drive share link</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category" className="text-sm">
                  Category
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value, subfolder: "" })}
                  required
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {availableSubfolders.length > 0 && (
                <div className="grid gap-2">
                  <Label htmlFor="subfolder" className="text-sm">
                    Subfolder
                  </Label>
                  <Select
                    value={formData.subfolder}
                    onValueChange={(value) => setFormData({ ...formData, subfolder: value })}
                  >
                    <SelectTrigger id="subfolder" className="text-sm">
                      <SelectValue placeholder="Select subfolder" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubfolders.map((subfolder) => (
                        <SelectItem key={subfolder} value={subfolder}>
                          {subfolder}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="size" className="text-sm">
                  File Size (optional)
                </Label>
                <Input
                  id="size"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  placeholder="e.g., 236.32 KB"
                  className="text-sm"
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="w-full sm:w-auto text-sm"
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto text-sm">
                {editingDocument ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
