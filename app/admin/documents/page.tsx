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

interface Document {
  id: number
  name: string
  driveId: string
  category: string
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
    setFormData({ name: "", driveId: "", category: "", size: "" })
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
      size: doc.size || "",
    })
    setIsDialogOpen(true)
  }

  const getCategoryLabel = (value: string) => {
    return CATEGORIES.find((cat) => cat.value === value)?.label || value
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Document Management</h1>
          <p className="text-muted-foreground">Manage HCGA IMS documents</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add Document
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Documents</CardTitle>
          <CardDescription>Filter documents by category</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full md:w-[300px]">
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
          <CardContent className="py-8 text-center text-muted-foreground">
            No documents found. Click "Add Document" to create one.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{doc.name}</h3>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span className="font-medium">{getCategoryLabel(doc.category)}</span>
                      {doc.size && <span>{doc.size}</span>}
                      <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Drive ID: {doc.driveId}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(`https://drive.google.com/file/d/${doc.driveId}/view`, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => openEditDialog(doc)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(doc.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingDocument ? "Edit Document" : "Add New Document"}</DialogTitle>
              <DialogDescription>
                {editingDocument ? "Update document information" : "Add a new document from Google Drive"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Document Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., SK - GSM - 111..."
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="driveId">Google Drive ID</Label>
                <Input
                  id="driveId"
                  value={formData.driveId}
                  onChange={(e) => setFormData({ ...formData, driveId: e.target.value })}
                  placeholder="e.g., 1aklY4tO7p5UhFoUYF2PSOP6VfL55Fdug"
                  required
                />
                <p className="text-xs text-muted-foreground">Extract ID from Google Drive share link</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  required
                >
                  <SelectTrigger>
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
              <div className="grid gap-2">
                <Label htmlFor="size">File Size (optional)</Label>
                <Input
                  id="size"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  placeholder="e.g., 236.32 KB"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingDocument ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
