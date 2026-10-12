import React, { useState, useEffect } from 'react';
import { adminApi } from '../../lib/api/adminApi';
import { Save, Loader, Globe, Image as ImageIcon, AlignLeft, Type, Link as LinkIcon, ToggleLeft, Layout } from 'lucide-react';
import { defaultCmsContent } from '../../lib/cms/defaultContent';
import { ImageUpload } from '../../components/common/ImageUpload';

type CmsFieldType = 'text' | 'textarea' | 'image' | 'boolean' | 'url';

interface CmsField {
  key: string;
  label: string;
  type: CmsFieldType;
}

interface CmsSection {
  title: string;
  fields: CmsField[];
}

interface CmsTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  sections: CmsSection[];
}

export const SettingsEditor: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('header');

  const cmsSchema: CmsTab[] = [
    {
      id: 'header',
      label: 'Header & Nav',
      icon: <Layout className="w-4 h-4" />,
      sections: [
        {
          title: 'Brand & Logo',
          fields: [
            { key: 'site.header.logo', label: 'Logo URL', type: 'image' },
            { key: 'site.header.brandName', label: 'Brand Name', type: 'text' },
          ]
        },
        {
          title: 'Navigation Visibility',
          fields: [
            { key: 'site.header.nav.home.label', label: 'Home Label', type: 'text' },
            { key: 'site.header.nav.home.visible', label: 'Show Home Link', type: 'boolean' },
            { key: 'site.header.nav.courses.label', label: 'Courses Label', type: 'text' },
            { key: 'site.header.nav.courses.visible', label: 'Show Courses Link', type: 'boolean' },
            { key: 'site.header.nav.about.label', label: 'About Label', type: 'text' },
            { key: 'site.header.nav.about.visible', label: 'Show About Link', type: 'boolean' },
            { key: 'site.header.nav.contact.label', label: 'Contact Label', type: 'text' },
            { key: 'site.header.nav.contact.visible', label: 'Show Contact Link', type: 'boolean' },
          ]
        },
        {
          title: 'Call to Action Button',
          fields: [
            { key: 'site.header.cta.enabled', label: 'Enable CTA Button', type: 'boolean' },
            { key: 'site.header.cta.label', label: 'Button Label', type: 'text' },
            { key: 'site.header.cta.link', label: 'Button Link', type: 'url' },
          ]
        }
      ]
    },
    {
      id: 'home',
      label: 'Home Page',
      icon: <Globe className="w-4 h-4" />,
      sections: [
        {
          title: 'Hero Section',
          fields: [
            { key: 'home.hero.eyebrow', label: 'Eyebrow Text', type: 'text' },
            { key: 'home.hero.title', label: 'Main Title', type: 'textarea' },
            { key: 'home.hero.subtitle', label: 'Subtitle', type: 'textarea' },
            { key: 'home.hero.image', label: 'Hero Image URL', type: 'image' },
            { key: 'home.hero.primaryButton.label', label: 'Primary Button Label', type: 'text' },
            { key: 'home.hero.primaryButton.link', label: 'Primary Button Link', type: 'url' },
            { key: 'home.hero.secondaryButton.label', label: 'Secondary Button Label', type: 'text' },
            { key: 'home.hero.secondaryButton.link', label: 'Secondary Button Link', type: 'url' },
          ]
        },
        {
          title: 'About Teaser',
          fields: [
            { key: 'home.about.enabled', label: 'Show About Section', type: 'boolean' },
            { key: 'home.about.eyebrow', label: 'Eyebrow', type: 'text' },
            { key: 'home.about.title', label: 'Title', type: 'text' },
            { key: 'home.about.description', label: 'Description', type: 'textarea' },
            { key: 'home.about.image', label: 'Image URL', type: 'image' },
            { key: 'home.about.button.label', label: 'Button Label', type: 'text' },
            { key: 'home.about.button.link', label: 'Button Link', type: 'url' },
          ]
        },
        {
          title: 'Why Choose Us',
          fields: [
            { key: 'home.whyChoose.enabled', label: 'Show Why Choose Us', type: 'boolean' },
            { key: 'home.whyChoose.eyebrow', label: 'Eyebrow', type: 'text' },
            { key: 'home.whyChoose.title', label: 'Title', type: 'text' },
            { key: 'home.whyChoose.description', label: 'Description', type: 'textarea' },
            { key: 'home.whyChoose.image', label: 'Image URL', type: 'image' },
          ]
        },
        {
          title: 'Featured Courses Section',
          fields: [
            { key: 'home.courses.enabled', label: 'Show Courses Section', type: 'boolean' },
            { key: 'home.courses.title', label: 'Title', type: 'text' },
            { key: 'home.courses.description', label: 'Description', type: 'textarea' },
            { key: 'home.courses.cta', label: 'Button Label', type: 'text' },
          ]
        },
        {
          title: 'Branches Section',
          fields: [
            { key: 'home.branches.enabled', label: 'Show Branches Section', type: 'boolean' },
            { key: 'home.branches.title', label: 'Title', type: 'text' },
            { key: 'home.branches.description', label: 'Description', type: 'textarea' },
          ]
        }
      ]
    },
    {
      id: 'courses',
      label: 'Courses Page',
      icon: <Layout className="w-4 h-4" />,
      sections: [
        {
          title: 'Page Header',
          fields: [
            { key: 'courses.hero.title', label: 'Page Title', type: 'text' },
            { key: 'courses.hero.subtitle', label: 'Page Subtitle', type: 'textarea' },
          ]
        }
      ]
    },
    {
      id: 'about',
      label: 'About Page',
      icon: <Layout className="w-4 h-4" />,
      sections: [
        {
          title: 'Hero Section',
          fields: [
            { key: 'about.hero.eyebrow', label: 'Eyebrow', type: 'text' },
            { key: 'about.hero.title', label: 'Title', type: 'text' },
            { key: 'about.hero.description', label: 'Description', type: 'textarea' },
            { key: 'about.hero.image', label: 'Hero Image URL', type: 'image' },
          ]
        },
        {
          title: 'Mission & Vision',
          fields: [
            { key: 'about.mission.title', label: 'Mission Title', type: 'text' },
            { key: 'about.mission.description', label: 'Mission Description', type: 'textarea' },
            { key: 'about.vision.title', label: 'Vision Title', type: 'text' },
            { key: 'about.vision.description', label: 'Vision Description', type: 'textarea' },
          ]
        }
      ]
    },
    {
      id: 'contact',
      label: 'Contact Page',
      icon: <Layout className="w-4 h-4" />,
      sections: [
        {
          title: 'Hero Section',
          fields: [
            { key: 'contact.hero.eyebrow', label: 'Eyebrow', type: 'text' },
            { key: 'contact.hero.title', label: 'Title', type: 'text' },
            { key: 'contact.hero.description', label: 'Description', type: 'textarea' },
          ]
        },
        {
          title: 'Contact Information',
          fields: [
            { key: 'contact.info.address', label: 'HQ Address', type: 'textarea' },
            { key: 'contact.info.hours', label: 'Working Hours', type: 'textarea' },
          ]
        }
      ]
    },
    {
      id: 'footer',
      label: 'Footer',
      icon: <Layout className="w-4 h-4" />,
      sections: [
        {
          title: 'Brand Information',
          fields: [
            { key: 'site.footer.description', label: 'About Description', type: 'textarea' },
            { key: 'site.footer.copyright', label: 'Copyright Text', type: 'text' },
          ]
        },
        {
          title: 'Contact Details',
          fields: [
            { key: 'site.footer.phone', label: 'Phone Number', type: 'text' },
            { key: 'site.footer.email', label: 'Email Address', type: 'text' },
          ]
        },
        {
          title: 'Social Links',
          fields: [
            { key: 'site.footer.social.facebook', label: 'Facebook URL', type: 'url' },
            { key: 'site.footer.social.instagram', label: 'Instagram URL', type: 'url' },
            { key: 'site.footer.social.youtube', label: 'YouTube URL', type: 'url' },
          ]
        }
      ]
    }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSettings();
      const settingsMap: Record<string, string> = { ...defaultCmsContent };
      
      if (res.data) {
        res.data.forEach((s: any) => {
          if (s.value !== undefined) {
            settingsMap[s.key] = s.value;
          }
        });
      }
      
      setSettings(settingsMap);
    } catch (err) {
      console.error(err);
      setSettings({ ...defaultCmsContent });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string, value: string) => {
    setSavingKey(key);
    try {
      await adminApi.updateSetting(key, value);
      // Update local state to reflect successful save
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (err) {
      alert('Failed to update setting');
    } finally {
      setSavingKey(null);
    }
  };

  const handleBooleanToggle = (key: string) => {
    const currentValue = settings[key] === 'true';
    const newValue = currentValue ? 'false' : 'true';
    setSettings({ ...settings, [key]: newValue });
    handleSave(key, newValue);
  };

  const activeTabContent = cmsSchema.find(t => t.id === activeTab);

  if (loading) return <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center space-y-4">
    <Loader className="w-8 h-8 animate-spin text-jadmaa-red" />
    <span>Loading CMS...</span>
  </div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-extrabold text-gray-900">Website Content Editor</h2>
        <p className="text-sm text-gray-500 mt-1">Manage public website content, headings, and visibility. These changes apply immediately to the public marketing site.</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 flex flex-col space-y-1 bg-white p-2 rounded-xl border border-gray-200 shadow-sm shrink-0">
          {cmsSchema.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${
                activeTab === tab.id 
                  ? 'bg-jadmaa-red text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full space-y-6">
          {activeTabContent?.sections.map((section, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="font-heading font-bold text-lg text-gray-900">{section.title}</h3>
              </div>
              
              <div className="divide-y divide-gray-100">
                {section.fields.map(field => (
                  <div key={field.key} className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8 hover:bg-gray-50/50 transition-colors">
                    <div className="lg:col-span-1">
                      <div className="flex items-center space-x-2 text-gray-800 font-bold text-sm mb-1">
                        {field.type === 'text' && <Type className="w-4 h-4 text-gray-400" />}
                        {field.type === 'textarea' && <AlignLeft className="w-4 h-4 text-gray-400" />}
                        {field.type === 'image' && <ImageIcon className="w-4 h-4 text-gray-400" />}
                        {field.type === 'url' && <LinkIcon className="w-4 h-4 text-gray-400" />}
                        {field.type === 'boolean' && <ToggleLeft className="w-4 h-4 text-gray-400" />}
                        <span>{field.label}</span>
                      </div>
                      <p className="text-[10px] font-mono text-gray-400 break-all">{field.key}</p>
                    </div>

                    <div className="lg:col-span-2 space-y-3">
                      {field.type === 'boolean' ? (
                        <div className="flex items-center h-full">
                          <button 
                            onClick={() => handleBooleanToggle(field.key)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings[field.key] === 'true' ? 'bg-emerald-500' : 'bg-gray-300'}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[field.key] === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                          <span className="ml-3 text-sm font-medium text-gray-600">
                            {settings[field.key] === 'true' ? 'Enabled (Visible)' : 'Disabled (Hidden)'}
                          </span>
                        </div>
                      ) : (
                        <>
                          {field.type === 'image' ? (
                            <ImageUpload
                              value={settings[field.key] || ''}
                              onChange={(url) => setSettings({ ...settings, [field.key]: url })}
                              placeholder="https://example.com/image.jpg"
                              helperText="Upload image from your device or paste an image URL"
                            />
                          ) : field.type === 'textarea' ? (
                            <textarea
                              rows={4}
                              value={settings[field.key] || ''}
                              onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-jadmaa-red focus:ring-1 focus:ring-jadmaa-red text-sm resize-y"
                            />
                          ) : (
                            <input
                              type={field.type === 'url' ? 'url' : 'text'}
                              value={settings[field.key] || ''}
                              onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-jadmaa-red focus:ring-1 focus:ring-jadmaa-red text-sm"
                            />
                          )}
                          
                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => handleSave(field.key, settings[field.key])}
                              disabled={savingKey === field.key}
                              className="flex items-center space-x-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
                            >
                              {savingKey === field.key ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              <span>{savingKey === field.key ? 'Saving...' : 'Save'}</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
