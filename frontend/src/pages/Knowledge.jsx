import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import AppShell from '../components/AppShell.jsx';
import ModuleHeader from '../components/ModuleHeader.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Badge from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Archive, FileText, Search, Trash2, Upload, BrainCircuit, Sparkles } from 'lucide-react';

const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/csv'];

const Knowledge = () => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState('');
  const [retrieval, setRetrieval] = useState(null);
  const [query, setQuery] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const { pushToast } = useToast();

  const load = async () => {
    const { data } = await api.get('/knowledge/files');
    setFiles(data.documents || []);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => files.filter((file) => `${file.filename} ${file.text_content}`.toLowerCase().includes(search.toLowerCase())),
    [files, search]
  );

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!allowedTypes.includes(file.type) && !['.txt', '.csv', '.pdf', '.docx'].some((ext) => file.name.toLowerCase().endsWith(ext))) {
      pushToast({ tone: 'error', title: 'Unsupported file type', message: 'Upload PDF, DOCX, TXT, or CSV files.' });
      return;
    }
    setSelectedFile(file);
    setPreview(await file.text());
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    const syntheticEvent = { target: { files: [file] } };
    await handleFile(syntheticEvent);
  };

  const upload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setProgress(25);
    try {
      const content = preview || await selectedFile.text();
      setProgress(55);
      await api.post('/knowledge/upload', {
        filename: selectedFile.name,
        mimeType: selectedFile.type || 'text/plain',
        originalName: selectedFile.name,
        size: selectedFile.size,
        content,
        metadata: { uploadedAt: new Date().toISOString() }
      });
      setProgress(100);
      await load();
      pushToast({ tone: 'success', title: 'Document uploaded', message: 'The file was stored and chunked for retrieval.' });
      setSelectedFile(null);
      setPreview('');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const remove = async (documentId) => {
    await api.delete('/knowledge/file', { data: { documentId } });
    await load();
    pushToast({ tone: 'info', title: 'Document deleted', message: 'The file and its chunks were removed.' });
  };

  const searchDocs = async () => {
    const { data } = await api.get('/knowledge/search', { params: { query: search } });
    setRetrieval(data);
  };

  const retrieve = async () => {
    const ids = filtered.slice(0, 3).map((file) => file.id);
    const { data } = await api.post('/knowledge/retrieve', { documentIds: ids, query });
    setRetrieval(data);
    pushToast({ tone: 'success', title: 'Context retrieved', message: 'Relevant chunks are ready for AI injection.' });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <ModuleHeader
          eyebrow="Knowledge Hub"
          title="Document knowledge base"
          description="Upload files, inspect extracted content, search the library, and retrieve ranked chunks for AI context."
          actions={<Badge tone="accent"><BrainCircuit size={14} className="mr-2 inline" /> retrieval ready</Badge>}
        />

        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Card className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-semibold"><Upload size={16} /> Upload</h2>
                <Badge tone="default">{files.length} files</Badge>
              </div>
              <div
                className={`rounded-2xl border border-dashed p-5 transition ${dragActive ? 'border-[var(--ui-accent)] bg-blue-50/50' : 'border-[var(--ui-border)] bg-[var(--ui-surface-muted)]'}`}
                onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
              >
                <input type="file" accept=".pdf,.docx,.txt,.csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv" onChange={handleFile} className="block w-full text-sm" />
                <p className="mt-3 text-sm text-[var(--ui-text-muted)]">Drag and drop a file here or use the picker below. The file is previewed before storage.</p>
                {selectedFile ? (
                  <div className="mt-4 space-y-3">
                    <p className="font-medium">{selectedFile.name}</p>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--ui-surface)]">
                      <div className="h-full rounded-full bg-[var(--ui-accent)] transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <pre className="max-h-48 overflow-auto rounded-2xl bg-[var(--ui-surface)] p-3 text-xs">{preview.slice(0, 1000)}</pre>
                    <Button variant="primary" onClick={upload} disabled={uploading}><Sparkles size={16} /> {uploading ? 'Uploading...' : 'Upload file'}</Button>
                  </div>
                ) : null}
              </div>
            </Card>

            <Card className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-semibold"><FileText size={16} /> Files</h2>
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search files" className="max-w-xs" />
              </div>
              <div className="space-y-3">
                {filtered.length ? filtered.map((file) => (
                  <article key={file.id} className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{file.filename}</p>
                        <p className="mt-1 text-xs text-[var(--ui-text-muted)]">{file.mime_type} · {new Date(file.created_at).toLocaleString()}</p>
                        <p className="mt-2 text-sm text-[var(--ui-text-muted)] line-clamp-3">{file.text_content?.slice(0, 200) || 'No preview available.'}</p>
                      </div>
                      <button type="button" className="rounded-lg border border-[var(--ui-border)] p-2" onClick={() => remove(file.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Badge tone="success">chunks: {file.chunk_count ?? 0}</Badge>
                      <Badge tone="accent">ready</Badge>
                    </div>
                  </article>
                )) : <EmptyState title="No files uploaded" description="Upload a document to begin searching and retrieval." />}
              </div>
            </Card>

            <Card className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-semibold"><Search size={16} /> Search</h2>
                <Button variant="secondary" onClick={searchDocs}>Search docs</Button>
              </div>
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search keyword" />
              <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                {retrieval ? (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold">Relevant documents</p>
                    <pre className="overflow-auto text-xs">{JSON.stringify(retrieval.documents || retrieval.chunks || retrieval, null, 2)}</pre>
                  </div>
                ) : (
                  <EmptyState title="Search results will appear here" description="Run a keyword or retrieval query to surface relevant document snippets." />
                )}
              </div>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card className="space-y-4">
              <h2 className="font-semibold">Retrieval</h2>
              <p className="text-sm text-[var(--ui-text-muted)]">Rank chunks and inject context into AI prompts.</p>
              <Button variant="primary" onClick={retrieve}><Archive size={16} /> Retrieve context</Button>
              <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">Injected context</p>
                <pre className="mt-2 overflow-auto text-xs">{JSON.stringify(retrieval?.context || '', null, 2)}</pre>
              </div>
            </Card>
          </aside>
        </section>
      </div>
    </AppShell>
  );
};

export default Knowledge;
