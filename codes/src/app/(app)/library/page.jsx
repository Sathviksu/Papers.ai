'use client';

import { useState } from 'react';
import { MOCK_PAPERS } from '@/lib/mock-data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Trash2, Download, MoreHorizontal, Eye } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

export default function LibraryPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);

  // Mock semantic search filter
  const filteredPapers = MOCK_PAPERS.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.authors.some(a => a.toLowerCase().includes(search.toLowerCase())) ||
    p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleAll = () => {
    if (selected.length === filteredPapers.length) setSelected([]);
    else setSelected(filteredPapers.map(p => p.id));
  };

  const toggleOne = (id) => {
    if (selected.includes(id)) setSelected(selected.filter(i => i !== id));
    else setSelected([...selected, id]);
  };

  return (
    <div className="max-w-6xl mx-auto pt-4 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight text-[#1A56B0]">
            Document Library
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your uploaded papers, search concepts, and organize research.
          </p>
        </div>
        
        {/* Bulk Actions */}
        {selected.length > 0 && (
          <div className="flex items-center gap-2 animate-in fade-in bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
            <span className="text-sm font-medium text-[#1A56B0] mr-2">
              {selected.length} selected
            </span>
            <Button variant="outline" size="sm" className="bg-white">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button variant="outline" size="sm" className="bg-white text-red-600 hover:text-red-700 hover:bg-red-50">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Semantic search across all papers..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" /> Filters
        </Button>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-12">
                <Checkbox 
                  checked={selected.length === filteredPapers.length && filteredPapers.length > 0} 
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Author(s)</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPapers.map((paper) => (
              <TableRow key={paper.id} className="group">
                <TableCell>
                  <Checkbox 
                    checked={selected.includes(paper.id)} 
                    onCheckedChange={() => toggleOne(paper.id)}
                  />
                </TableCell>
                <TableCell className="font-medium max-w-xs truncate">
                  <Link href={`/papers/${paper.id}`} className="hover:underline text-[#1A56B0]">
                    {paper.title}
                  </Link>
                  <div className="flex gap-1 mt-1">
                    {paper.tags.map(t => <span key={t} className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{t}</span>)}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground truncate max-w-[150px]">
                  {paper.authors[0]} {paper.authors.length > 1 && '+ others'}
                </TableCell>
                <TableCell className="text-muted-foreground">{paper.uploadDate}</TableCell>
                <TableCell>
                  <Badge variant={paper.status === 'completed' ? 'default' : 'secondary'} className={paper.status === 'completed' ? "bg-green-600 hover:bg-green-700 font-normal" : "font-normal"}>
                    {paper.status === 'processing' ? 'Processing' : 'Analyzed'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/papers/${paper.id}`}><Eye className="mr-2 h-4 w-4" /> View Paper</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem><Download className="mr-2 h-4 w-4" /> Export Data</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredPapers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No papers found matching "{search}"
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
