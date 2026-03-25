'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { uploadPaper } from '@/lib/actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  authors: z.string().min(1, 'At least one author is required.'),
  paperText: z.string().min(100, 'Paper text must be at least 100 characters.'),
});

export function UploadPaperDialog({ children }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('paste');

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      authors: '',
      paperText: '',
    },
  });

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        form.setValue('paperText', text, { shouldValidate: true });
        setActiveTab('paste');
        toast({
          title: 'File Content Loaded',
          description:
            'The paper text has been populated from the uploaded file.',
        });
      };
      reader.onerror = () => {
        toast({
          variant: 'destructive',
          title: 'File Read Error',
          description: 'Could not read the selected file.',
        });
      };
      reader.readAsText(file);
    }
  };

  const onSubmit = (values) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('authors', values.authors);
      formData.append('paperText', values.paperText);

      try {
        await uploadPaper(formData);
        toast({
          title: 'Paper Uploaded',
          description: 'Your paper has been added to your library.',
        });
        setOpen(false);
        form.reset();
        setActiveTab('paste');
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: 'Something went wrong while uploading the paper.',
        });
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          form.reset();
          setActiveTab('paste');
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Paper</DialogTitle>
          <DialogDescription>
            Enter the details of your paper below. You can either paste the text
            directly or upload a file.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Attention Is All You Need"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="authors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Authors</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., A. Vaswani, N. Shazeer"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Comma-separated.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paperText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paper Content</FormLabel>
                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="paste">Paste Text</TabsTrigger>
                      <TabsTrigger value="upload">Upload File</TabsTrigger>
                    </TabsList>
                    <TabsContent value="paste" className="mt-2">
                      <FormControl>
                        <Textarea
                          placeholder="Paste the full text of the research paper here, or use the 'Upload File' tab."
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                    </TabsContent>
                    <TabsContent value="upload" className="mt-2">
                      <FormControl>
                        <Input
                          type="file"
                          accept=".txt,.md"
                          onChange={handleFileChange}
                        />
                      </FormControl>
                      <FormDescription className="pt-2">
                        Upload a text file (.txt, .md). The content will be
                        loaded into the 'Paste Text' tab.
                      </FormDescription>
                    </TabsContent>
                  </Tabs>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Uploading...' : 'Upload'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
