'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useBusiness } from '@/lib/hooks/use-business';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { REVIEW_TEMPLATES, type TemplateId } from '@/lib/templates';
import {
  Link2,
  Copy,
  Check,
  Download,
  QrCode,
  Building,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertCircle,
  Palette,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CollectPage() {
  const { business } = useBusiness();
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [publicUrl, setPublicUrl] = useState<string>('');

  // Extract initial template (from review_template column or description tag)
  const initialTemplate: TemplateId = (() => {
    if (business?.review_template && business.review_template in REVIEW_TEMPLATES) {
      return business.review_template as TemplateId;
    }
    const match = business?.description?.match(/\[template:([a-z]+)\]/i);
    if (match && match[1] in REVIEW_TEMPLATES) {
      return match[1] as TemplateId;
    }
    return 'default';
  })();

  const initialCleanDesc = (business?.description || '').replace(/\s*\[template:[a-z]+\]/gi, '').trim();

  // Form states
  const [name, setName] = useState(business?.name || '');
  const [description, setDescription] = useState(initialCleanDesc);
  const [website, setWebsite] = useState(business?.website || '');
  const [industry, setIndustry] = useState(business?.industry || '');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>(initialTemplate);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && business?.slug) {
      const origin = window.location.origin;
      const url = `${origin}/r/${business.slug}`;
      setPublicUrl(url);

      QRCode.toDataURL(url, {
        width: 320,
        margin: 2,
        color: {
          dark: '#1e1b4b',
          light: '#ffffff',
        },
      })
        .then((dataUrl) => {
          setQrCodeDataUrl(dataUrl);
        })
        .catch((err) => {
          console.error('Failed to generate QR code:', err);
        });
    }
  }, [business?.slug]);

  const handleCopy = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = `${business?.slug || 'review'}-qr-code.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id) return;

    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const supabase = createClient();

      // Clean description
      const cleanDesc = description.trim();

      // First try updating with native review_template column
      let updatePayload: Record<string, unknown> = {
        name: name.trim(),
        description: cleanDesc || null,
        website: website.trim() || null,
        industry: industry.trim() || null,
        review_template: selectedTemplate,
        updated_at: new Date().toISOString(),
      };

      let { error } = await supabase
        .from('businesses')
        .update(updatePayload)
        .eq('id', business.id);

      // If review_template column does not exist yet in DB, fallback to embedding in description
      if (error && error.message?.includes('review_template')) {
        const descWithTag = cleanDesc
          ? `${cleanDesc} [template:${selectedTemplate}]`
          : `[template:${selectedTemplate}]`;

        updatePayload = {
          name: name.trim(),
          description: descWithTag,
          website: website.trim() || null,
          industry: industry.trim() || null,
          updated_at: new Date().toISOString(),
        };

        const retryRes = await supabase
          .from('businesses')
          .update(updatePayload)
          .eq('id', business.id);

        error = retryRes.error;
      }

      if (error) {
        setSaveError(error.message);
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Review Collection Hub
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Share your review link, download your in-person QR code, and customize your customer review page template.
        </p>
      </div>

      {/* Review Link & QR Code Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Public Review Link Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-indigo-600" />
              <CardTitle>Direct Review Link</CardTitle>
            </div>
            <CardDescription>
              Share this link directly via email, SMS, or post-purchase followups.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">
                Public Review URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={publicUrl}
                  className="w-full text-xs font-mono bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none select-all"
                />
                <Button
                  type="button"
                  size="sm"
                  variant={copied ? 'secondary' : 'primary'}
                  onClick={handleCopy}
                  className="shrink-0 flex items-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800"
              >
                Open public review page in new tab
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                Active Theme: {REVIEW_TEMPLATES[selectedTemplate]?.name}
              </span>
            </div>

            <div className="bg-indigo-50/70 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-900 space-y-1">
              <p className="font-semibold">💡 Collection Tip</p>
              <p className="text-indigo-700 leading-relaxed">
                Add this link to your automated order receipts or print the QR code below on table tents, counters, and invoices.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* QR Code Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-indigo-600" />
              <CardTitle>In-Person QR Code</CardTitle>
            </div>
            <CardDescription>
              Display at checkout counters, tables, or product packaging.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-6">
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm shrink-0">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="Review QR Code"
                  className="w-40 h-40 object-contain rounded"
                />
              ) : (
                <div className="w-40 h-40 bg-gray-100 animate-pulse rounded flex items-center justify-center text-xs text-gray-400">
                  Generating QR...
                </div>
              )}
            </div>

            <div className="space-y-3 text-center sm:text-left">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Scan to Review
                </h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Customers can scan with their phone camera to instantly leave feedback without installing any app.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadQR}
                disabled={!qrCodeDataUrl}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download High-Res PNG
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Review Page Template Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-indigo-600" />
            <CardTitle>Review Page Template & Design</CardTitle>
          </div>
          <CardDescription>
            Choose a visual style for your customer feedback page. Each template is uniquely styled with custom colors, badges, and atmosphere. Default is selected automatically if not customized.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Object.keys(REVIEW_TEMPLATES) as TemplateId[]).map((tmplKey) => {
              const tmpl = REVIEW_TEMPLATES[tmplKey];
              const isSelected = selectedTemplate === tmplKey;

              return (
                <div
                  key={tmplKey}
                  onClick={() => setSelectedTemplate(tmplKey)}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all cursor-pointer relative flex flex-col justify-between hover:shadow-md text-left',
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/20 ring-2 ring-indigo-500/20'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        {tmpl.badge}
                      </span>
                      {isSelected && (
                        <div className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>

                    <h4 className="font-bold text-sm text-gray-900">{tmpl.name}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {tmpl.description}
                    </p>
                  </div>

                  {/* Visual Color Palette Swatches */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400 font-medium">Palette:</span>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-4 w-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: tmpl.previewColors.bg }}
                        title="Background"
                      />
                      <div
                        className="h-4 w-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: tmpl.previewColors.card }}
                        title="Card Surface"
                      />
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: tmpl.previewColors.accent }}
                        title="Primary Accent"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Active Template: <span className="text-indigo-600">{REVIEW_TEMPLATES[selectedTemplate]?.name}</span>
                </p>
                <p className="text-xs text-gray-500">
                  Remember to click &quot;Save Changes&quot; below to update your public review page.
                </p>
              </div>
            </div>

            {publicUrl && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                Live Preview
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Business Details & Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-indigo-600" />
            <CardTitle>Business Review Profile & Details</CardTitle>
          </div>
          <CardDescription>
            This information is shown to customers on the public review submission page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveBusiness} className="space-y-4">
            {saveSuccess && (
              <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Business settings and template updated successfully!</span>
              </div>
            )}

            {saveError && (
              <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Business Name"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Trust Restaurant"
              />

              <Input
                label="Industry / Category"
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Restaurant, Hospitality, Retail, Tech"
              />
            </div>

            <Input
              label="Website (Optional)"
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
            />

            <div className="space-y-1">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Public Greeting / Subtitle
              </label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Thank you for visiting! Please share your thoughts to help us serve you better."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end pt-3">
              <Button
                type="submit"
                loading={saving}
                className="flex items-center gap-2 px-6"
              >
                <Save className="h-4 w-4" />
                Save Changes & Template
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
