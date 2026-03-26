import { createFileRoute } from '@tanstack/react-router';
import { Mail, Github, Send } from 'lucide-react';
import { useState, type FormEvent } from 'react';

export const Route = createFileRoute('/contact')({
  component: ContactPage,
});

export function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleChange =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const mailto = `mailto:contact@cineconnect.dev?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`;
    window.location.href = mailto;
    setSent(true);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-10 text-center">
        <div className="bg-letterboxd-green/20 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
          <Mail className="text-letterboxd-green h-8 w-8" />
        </div>
        <h1 className="font-display text-text-primary text-4xl font-bold">Contact Us</h1>
        <p className="text-text-secondary mt-3">
          Have a question, found a bug, or want to give feedback? We'd love to hear from you.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Contact info */}
        <div className="space-y-4 md:col-span-1">
          <div className="card flex items-start gap-3">
            <Mail className="text-letterboxd-green mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="text-text-primary text-sm font-semibold">Email</p>
              <p className="text-text-secondary text-sm">contact@cineconnect.dev</p>
            </div>
          </div>
          <div className="card flex items-start gap-3">
            <Github className="text-letterboxd-green mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="text-text-primary text-sm font-semibold">GitHub</p>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-letterboxd-green text-sm hover:underline"
              >
                View repository
              </a>
            </div>
          </div>
          <div className="card">
            <p className="text-text-primary mb-1 text-sm font-semibold">Made by</p>
            <p className="text-text-secondary text-sm">Paul Compagnon</p>
            <p className="text-text-secondary text-sm">Franck YAPI</p>
            <p className="text-text-tertiary mt-2 text-xs">Student project — CS degree</p>
          </div>
        </div>

        {/* Form */}
        <div className="card md:col-span-2">
          {sent ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="bg-letterboxd-green/20 flex h-16 w-16 items-center justify-center rounded-full">
                <Send className="text-letterboxd-green h-8 w-8" />
              </div>
              <h2 className="text-text-primary text-xl font-bold">Message sent!</h2>
              <p className="text-text-secondary text-sm">
                Your email client should have opened. We'll reply as soon as possible.
              </p>
              <button className="btn-secondary mt-2" onClick={() => setSent(false)}>
                Send another message
              </button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-text-secondary mb-1 block text-sm font-medium">Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Your name"
                    required
                    value={form.name}
                    onChange={handleChange('name')}
                  />
                </div>
                <div>
                  <label className="text-text-secondary mb-1 block text-sm font-medium">
                    Email
                  </label>
                  <input
                    type="email"
                    className="input"
                    placeholder="you@example.com"
                    required
                    value={form.email}
                    onChange={handleChange('email')}
                  />
                </div>
              </div>
              <div>
                <label className="text-text-secondary mb-1 block text-sm font-medium">
                  Subject
                </label>
                <select
                  className="input"
                  required
                  value={form.subject}
                  onChange={handleChange('subject')}
                >
                  <option value="">Select a subject…</option>
                  <option value="Bug report">Bug report</option>
                  <option value="Feature request">Feature request</option>
                  <option value="Account issue">Account issue</option>
                  <option value="General question">General question</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-text-secondary mb-1 block text-sm font-medium">
                  Message
                </label>
                <textarea
                  className="input min-h-[140px] resize-y"
                  placeholder="Describe your issue or question…"
                  required
                  value={form.message}
                  onChange={handleChange('message')}
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                Send message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
