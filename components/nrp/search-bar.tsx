"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
      <Input
        type="text"
        placeholder={placeholder || "Cari nama atau NRP..."}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 bg-[#1a1a1a] border-[#333] text-white placeholder:text-[#666]"
      />
    </div>
  )
}
