import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Save, Plus, Trash, Globe, FileText } from 'lucide-react';
import axiosInstance, { createNewsArticle } from '../services/api';

const SECTIONS = [
    "Front Page", "National", "State / UT", "City", "Business",
    "Technology", "International", "Sports", "Culture", "Editorial", "Weather & Notices"
];

const LANGUAGES = [
    { code: "en", name: "English" },
    { code: "ta", name: "Tamil" },
    { code: "hi", name: "Hindi" },
    { code: "ml", name: "Malayalam" }
];

export interface NewsArticleForm {
    region_type: string;
    region_name: string;
    section: string;
    page: number;
    priority: number;
    language: string;
    headline: string;
    subheadline: string;
    author: string;
    location: string;
    image_url: string;
    content: { value: string }[]; // Changed to object array for useFieldArray compatibility
}


export default function AdminNewsEditor() {
    const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const { register, control, handleSubmit, reset } = useForm<NewsArticleForm>({
        defaultValues: {
            region_type: 'State',
            region_name: 'Tamil Nadu',
            section: 'Front Page',
            page: 1,
            priority: 1,
            language: 'en',
            headline: '',
            subheadline: '',
            author: 'Staff Reporter',
            location: 'Chennai',
            image_url: '',
            content: [{ value: "" }] // Array of objects
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "content"
    });

    const onSubmit = async (data: NewsArticleForm) => {
        setStatus('saving');
        try {
            // Transform content back to string array for API
            const apiPayload = {
                ...data,
                content: data.content.map(c => c.value)
            };
            await createNewsArticle(apiPayload);
            setStatus('success');
            reset(data); // Reset form with current object structure
            setTimeout(() => setStatus('idle'), 2000);
        } catch (e) {
            console.error(e);
            setStatus('error');
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8">
            <header className="flex justify-between items-center border-b pb-4">
                <div>
                    <h1 className="text-3xl font-bold font-serif">Digital Newspaper Editor</h1>
                    <p className="text-slate-500">Create content for the PDF Generation Engine</p>
                </div>
                <div className={`px-4 py-1 rounded-full text-sm font-bold uppercase ${status === 'success' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {status === 'saving' ? 'Publishing...' : status === 'success' ? 'Published' : 'Draft Mode'}
                </div>
                <button
                    onClick={async () => {
                        if (confirm("This will fetch live news from Google RSS and add ~50 articles to the database. Continue?")) {
                            setStatus('saving');
                            try {
                                const res = await axiosInstance.post('/news/auto-populate');
                                alert(res.data.message);
                                setStatus('success');
                            } catch (e) { alert("Ingestion Failed"); setStatus('error'); }
                            setStatus('idle');
                        }
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 text-xs font-bold uppercase"
                >
                    <Globe size={14} /> Auto-Ingest Live News
                </button>
            </header>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Metadata */}
                <div className="space-y-6 lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
                        <h3 className="font-bold border-b pb-2 flex items-center gap-2">
                            <Globe size={16} /> Targeting
                        </h3>

                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Region Type</label>
                            <select {...register("region_type")} className="w-full p-2 border rounded">
                                <option value="Nation">Nation</option>
                                <option value="State">State</option>
                                <option value="UT">Union Territory</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Region Name</label>
                            <input {...register("region_name")} placeholder="e.g. India, Tamil Nadu" className="w-full p-2 border rounded" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Language</label>
                            <select {...register("language")} className="w-full p-2 border rounded">
                                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
                        <h3 className="font-bold border-b pb-2 flex items-center gap-2">
                            <FileText size={16} /> Layout
                        </h3>

                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Page Number (1-11)</label>
                            <input type="number" {...register("page", { valueAsNumber: true })} min="1" max="11" className="w-full p-2 border rounded" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Section</label>
                            <select {...register("section")} className="w-full p-2 border rounded">
                                {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Priority (1=High)</label>
                            <input type="number" {...register("priority", { valueAsNumber: true })} min="1" max="100" className="w-full p-2 border rounded" />
                        </div>
                    </div>
                </div>

                {/* Right Column: Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">

                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Headline</label>
                            <input {...register("headline", { required: true })} className="w-full p-3 text-lg font-bold border rounded font-serif" placeholder="Enter main headline..." />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Sub-Headline</label>
                            <input {...register("subheadline")} className="w-full p-2 border rounded font-serif italic" placeholder="Secondary text..." />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Author</label>
                                <input {...register("author")} className="w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Location / Dateline</label>
                                <input {...register("location")} className="w-full p-2 border rounded" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Image URL</label>
                            <input {...register("image_url")} className="w-full p-2 border rounded" placeholder="https://..." />
                        </div>

                    </div>

                    <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="block text-xs font-bold uppercase text-slate-500">Article Content (Paragraphs)</label>
                            <button type="button" onClick={() => append({ value: "" })} className="text-xs flex items-center gap-1 text-blue-600 hover:underline">
                                <Plus size={12} /> Add Paragraph
                            </button>
                        </div>

                        {fields.map((field, index) => (
                            <div key={field.id} className="flex gap-2">
                                <textarea
                                    {...register(`content.${index}.value` as const)}
                                    className="w-full p-3 border rounded min-h-[100px] font-serif leading-relaxed"
                                    placeholder={`Paragraph ${index + 1}...`}
                                />
                                <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-600 self-start mt-2">
                                    <Trash size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={() => reset()} className="px-6 py-2 border rounded hover:bg-slate-50">
                            Clear Form
                        </button>
                        <button type="submit" disabled={status === 'saving'} className="flex items-center gap-2 px-8 py-2 bg-black text-white rounded hover:bg-slate-800 disabled:opacity-50">
                            {status === 'saving' ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> : <Save size={18} />}
                            Publish to Edition
                        </button>
                    </div>
                </div>

            </form>
        </div>
    );
}
