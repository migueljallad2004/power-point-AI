'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  ImagePlus,
  LayoutTemplate,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { canVisitStage, reconcileSlides } from '@/lib/deck-state';
import { rankThemes, matchTheme } from '@/lib/template-match';
import {
  createSlideScene,
  chooseLayout,
  layouts,
  qualityIssues,
  type SlideLayout,
} from '@/lib/slide-design';
import { SlideScene } from '@/components/slide-scene';
import { ReferenceUpload } from '@/components/reference-upload';
import { TemplateExamples } from '@/components/template-examples';
import type { ReferenceDeck } from '@/lib/reference-deck';

type Stage = 'brief' | 'outline' | 'design' | 'deck';
type GenerationMode = 'research' | 'provided' | 'hybrid';
type Slide = {
  layout?: SlideLayout;
  title: string;
  body: string;
  bullets: string[];
  type: 'cover' | 'content' | 'closing';
};
type Logo = { name: string; data: string };
type LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
type Style = {
  name: string;
  note: string;
  bg: string;
  bg2: string;
  ink: string;
  accent: string;
  canvas: string;
  artwork?: string;
  font?: string;
};

const styles: Style[] = [
  {
    name: 'Ocean Discovery',
    note: 'New · marine science · illustrated',
    bg: '061C2C',
    bg2: '087D85',
    ink: 'FFFFFF',
    accent: '63E5D0',
    canvas: 'url(/themes/ocean-discovery.png) center / cover no-repeat',
    artwork: '/themes/ocean-discovery.png',
  },
  {
    name: 'Space Explorer',
    note: 'New · astronomy · cinematic',
    bg: '07101F',
    bg2: '294674',
    ink: 'FFFFFF',
    accent: 'FFC477',
    canvas: 'url(/themes/space-explorer.png) center / cover no-repeat',
    artwork: '/themes/space-explorer.png',
  },
  {
    name: 'Classroom Stories',
    note: 'New · school · illustrated',
    bg: 'FFF5E6',
    bg2: 'E79853',
    ink: '263345',
    accent: '238B83',
    canvas: 'url(/themes/classroom-stories.png) center / cover no-repeat',
    artwork: '/themes/classroom-stories.png',
  },
  {
    name: 'Sports Performance',
    note: 'New · fitness · energetic',
    bg: '0C1421',
    bg2: 'E46C32',
    ink: 'FFFFFF',
    accent: 'FFAC57',
    canvas: 'url(/themes/sports-performance.png) center / cover no-repeat',
    artwork: '/themes/sports-performance.png',
  },
  {
    name: 'Signal',
    note: 'Bold · technical',
    bg: '10172A',
    bg2: '6246EA',
    ink: 'FFFFFF',
    accent: '83E6FF',
    canvas:
      'radial-gradient(circle at 82% 18%, #83e6ff 0 4%, transparent 24%), linear-gradient(135deg, #10172a, #6246ea)',
  },
  {
    name: 'Editorial',
    note: 'Warm · premium',
    bg: 'F5F0E8',
    bg2: 'E86845',
    ink: '1E293B',
    accent: 'E86845',
    canvas: 'linear-gradient(90deg, #f5f0e8 0 68%, #e86845 68%)',
  },
  {
    name: 'Aura',
    note: 'Modern · creative',
    bg: '181326',
    bg2: 'D55DE8',
    ink: 'FFFFFF',
    accent: '9AF0DA',
    canvas:
      'radial-gradient(circle at 78% 20%, #d55de8, transparent 28%), radial-gradient(circle at 70% 78%, #9af0da, transparent 32%), #181326',
  },
  {
    name: 'Minimal',
    note: 'Clear · business',
    bg: 'FAFAF8',
    bg2: '20242E',
    ink: '20242E',
    accent: '4965E8',
    canvas: 'linear-gradient(135deg, #ffffff, #f0f1ed)',
  },
  {
    name: 'Horizon',
    note: 'Optimistic · bright',
    bg: 'FFF3C7',
    bg2: 'FF5F57',
    ink: '172033',
    accent: 'FF5F57',
    canvas:
      'linear-gradient(165deg, #fff3c7 0 58%, #ff5f57 58% 72%, #4031a8 72%)',
  },
  {
    name: 'Matrix',
    note: 'Digital · sharp',
    bg: '061B18',
    bg2: '00C896',
    ink: 'EFFFFA',
    accent: '65FFD5',
    canvas:
      'linear-gradient(rgba(101,255,213,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(101,255,213,.12) 1px, transparent 1px), #061b18',
  },
  {
    name: 'Gallery',
    note: 'Elegant · academic',
    bg: 'F0E8DB',
    bg2: '7A1832',
    ink: '2B2023',
    accent: '7A1832',
    canvas: 'linear-gradient(90deg, #7a1832 0 4%, #f0e8db 4% 92%, #d3a448 92%)',
  },
  {
    name: 'Prism',
    note: 'Colorful · energetic',
    bg: '151025',
    bg2: 'F54EA2',
    ink: 'FFFFFF',
    accent: 'FFE45E',
    canvas:
      'conic-gradient(from 220deg at 78% 34%, #151025, #4559ff, #f54ea2, #ffe45e, #151025)',
  },
  {
    name: 'Lecture',
    note: 'Clean · educational',
    bg: 'F8FAFC',
    bg2: '0F766E',
    ink: '172033',
    accent: '0F766E',
    canvas:
      'linear-gradient(135deg, #f8fafc 0 70%, #ccfbf1 70% 85%, #0f766e 85%)',
  },
  {
    name: 'Monolith',
    note: 'Luxury · dramatic',
    bg: '090909',
    bg2: 'B8985A',
    ink: 'FFFFFF',
    accent: 'E8D1A1',
    canvas:
      'linear-gradient(105deg, #090909 0 72%, #b8985a 72% 73%, #2c261c 73%)',
  },
  {
    name: 'Skyline',
    note: 'Corporate · polished',
    bg: 'EAF2FF',
    bg2: '1457D9',
    ink: '10233F',
    accent: '1457D9',
    canvas:
      'radial-gradient(circle at 86% 20%, #82b1ff, transparent 23%), linear-gradient(135deg, #f8fbff, #d9e8ff)',
  },
  {
    name: 'Pop',
    note: 'Playful · memorable',
    bg: 'FFF1F5',
    bg2: 'FF3D71',
    ink: '27152A',
    accent: '6C3BFF',
    canvas:
      'radial-gradient(circle at 82% 24%, #ff3d71 0 14%, transparent 14.5%), radial-gradient(circle at 72% 75%, #6c3bff 0 18%, transparent 18.5%), #fff1f5',
  },
  {
    name: 'Chalkboard',
    note: 'School · handmade',
    bg: '173B32',
    bg2: 'F4D35E',
    ink: 'FFFDF4',
    accent: 'F4D35E',
    canvas:
      'repeating-linear-gradient(0deg, transparent 0 24px, rgba(255,255,255,.035) 25px), #173b32',
  },
  {
    name: 'Notebook',
    note: 'Student · friendly',
    bg: 'FFFDF8',
    bg2: '6EA8FE',
    ink: '25324A',
    accent: 'EE6C7A',
    canvas:
      'linear-gradient(90deg, transparent 0 8%, #ee6c7a 8% 8.5%, transparent 8.5%), repeating-linear-gradient(#fffdf8 0 30px, #cfe2ff 31px)',
  },
  {
    name: 'Science Lab',
    note: 'STEM · discovery',
    bg: '071E35',
    bg2: '12D7C4',
    ink: 'FFFFFF',
    accent: 'B8FF5A',
    canvas:
      'radial-gradient(circle at 82% 25%, #12d7c4 0 8%, transparent 8.5%), radial-gradient(circle at 72% 56%, #b8ff5a 0 4%, transparent 4.5%), linear-gradient(135deg, #071e35, #113d5c)',
  },
  {
    name: 'Graduation',
    note: 'University · formal',
    bg: 'F6F1E7',
    bg2: '1D3557',
    ink: '1D2B3F',
    accent: 'C69C3B',
    canvas:
      'linear-gradient(120deg, #f6f1e7 0 72%, #c69c3b 72% 74%, #1d3557 74%)',
  },
  {
    name: 'Primary',
    note: 'Kids · colorful',
    bg: 'FFF9E8',
    bg2: 'FF595E',
    ink: '293241',
    accent: '1982C4',
    canvas:
      'radial-gradient(circle at 80% 24%, #ff595e 0 13%, transparent 13.5%), radial-gradient(circle at 70% 72%, #8ac926 0 16%, transparent 16.5%), #fff9e8',
  },
  {
    name: 'Campus',
    note: 'Academic · modern',
    bg: 'F3F7F4',
    bg2: '184E3A',
    ink: '18352A',
    accent: 'D4A72C',
    canvas: 'linear-gradient(90deg, #184e3a 0 5%, #f3f7f4 5% 88%, #d4a72c 88%)',
  },
  {
    name: 'Market',
    note: 'Finance · precise',
    bg: '071A2D',
    bg2: '1AA179',
    ink: 'FFFFFF',
    accent: '4DE0B5',
    canvas:
      'linear-gradient(150deg, transparent 0 58%, rgba(26,161,121,.35) 58% 60%, transparent 60%), #071a2d',
  },
  {
    name: 'Launch',
    note: 'Startup · confident',
    bg: '16142B',
    bg2: 'FF6B35',
    ink: 'FFFFFF',
    accent: 'FFD166',
    canvas:
      'linear-gradient(125deg, #16142b 0 62%, #ff6b35 62% 82%, #ffd166 82%)',
  },
  {
    name: 'Wellness',
    note: 'Health · calm',
    bg: 'EFFAF7',
    bg2: '43AA8B',
    ink: '1C4035',
    accent: 'F8967E',
    canvas:
      'radial-gradient(circle at 82% 24%, #43aa8b 0 18%, transparent 18.5%), radial-gradient(circle at 76% 76%, #f8967e 0 12%, transparent 12.5%), #effaf7',
  },
  {
    name: 'Terrain',
    note: 'Nature · organic',
    bg: '183A2A',
    bg2: '88B04B',
    ink: 'FFFFFF',
    accent: 'F2C14E',
    canvas:
      'radial-gradient(ellipse at 80% 85%, #88b04b 0 28%, transparent 28.5%), radial-gradient(ellipse at 92% 72%, #f2c14e 0 14%, transparent 14.5%), #183a2a',
  },
  {
    name: 'Runway',
    note: 'Fashion · editorial',
    bg: 'F5EDEC',
    bg2: '8C1C13',
    ink: '291919',
    accent: '8C1C13',
    canvas:
      'linear-gradient(90deg, #f5edec 0 60%, #8c1c13 60% 61%, #181313 61%)',
  },
  {
    name: 'Cyber',
    note: 'Technology · neon',
    bg: '070713',
    bg2: '8A2BE2',
    ink: 'FFFFFF',
    accent: '00F5D4',
    canvas:
      'linear-gradient(rgba(0,245,212,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,212,.12) 1px, transparent 1px), radial-gradient(circle at 80% 30%, #8a2be2, transparent 28%), #070713',
  },
  {
    name: 'Security Ops',
    note: 'SOC · command center · 5 layouts',
    bg: '050B14',
    bg2: '0B63F6',
    ink: 'F2F8FF',
    accent: '27E0A3',
    canvas:
      'linear-gradient(90deg, rgba(5,11,20,.02), rgba(5,11,20,.1)), url(/themes/security-ops.png) center / cover no-repeat',
    artwork: '/themes/security-ops.png',
  },
  {
    name: 'Zero Trust',
    note: 'Security · enterprise · 5 layouts',
    bg: '0A1020',
    bg2: 'FB3C6D',
    ink: 'FFFFFF',
    accent: '5CE1E6',
    canvas:
      'linear-gradient(90deg, rgba(10,16,32,.01), rgba(10,16,32,.08)), url(/themes/zero-trust-identity.png) center / cover no-repeat',
    artwork: '/themes/zero-trust-identity.png',
  },
  {
    name: 'Threat Map',
    note: 'Cyber · intelligence',
    bg: '03070C',
    bg2: 'EF233C',
    ink: 'F8FAFC',
    accent: 'FFB703',
    canvas:
      'radial-gradient(circle at 75% 35%, rgba(239,35,60,.8) 0 2%, transparent 3%), radial-gradient(circle at 86% 64%, rgba(255,183,3,.75) 0 1.5%, transparent 2.5%), repeating-radial-gradient(circle at 80% 50%, transparent 0 20px, rgba(239,35,60,.12) 21px 22px), #03070c',
  },
  {
    name: 'Neural',
    note: 'AI · neural network',
    bg: '10082B',
    bg2: '7C3AED',
    ink: 'FFFFFF',
    accent: '22D3EE',
    canvas:
      'radial-gradient(circle at 82% 28%, #22d3ee 0 3%, transparent 4%), radial-gradient(circle at 70% 62%, #a855f7 0 5%, transparent 6%), radial-gradient(circle at 92% 72%, #7c3aed 0 4%, transparent 5%), linear-gradient(135deg, #10082b, #22104d)',
  },
  {
    name: 'AI Core',
    note: 'AI · futuristic',
    bg: '07111F',
    bg2: '00A8E8',
    ink: 'F4FBFF',
    accent: '8DFFCD',
    canvas:
      'radial-gradient(circle at 80% 50%, #00a8e8 0 8%, rgba(0,168,232,.2) 9% 20%, transparent 21%), repeating-radial-gradient(circle at 80% 50%, transparent 0 30px, rgba(141,255,205,.12) 31px 32px), #07111f',
  },
  {
    name: 'Responsible AI',
    note: 'AI · clean research · 5 layouts',
    bg: 'F4F7FF',
    bg2: '405DE6',
    ink: '15213A',
    accent: '705CF6',
    canvas:
      'linear-gradient(90deg, rgba(244,247,255,.01), rgba(244,247,255,.05)), url(/themes/responsible-ai-premium.png) center / cover no-repeat',
    artwork: '/themes/responsible-ai-premium.png',
  },
  {
    name: 'Circuit Thesis',
    note: 'Cyber · university project · 5 layouts',
    bg: '020A33',
    bg2: '0866C6',
    ink: 'FFFFFF',
    accent: '26B5FF',
    canvas:
      'linear-gradient(90deg, rgba(2,10,51,.02), rgba(2,10,51,.08)), url(/themes/circuit-thesis.png) center / cover no-repeat',
    artwork: '/themes/circuit-thesis.png',
  },
  {
    name: 'Academic Studio',
    note: 'University · illustrated · 5 layouts',
    bg: 'F4E8DE',
    bg2: '2D3A3A',
    ink: '2D3033',
    accent: '00A67E',
    canvas:
      'linear-gradient(90deg, rgba(255,250,242,.04), rgba(255,250,242,.02)), url(/themes/academic-studio.png) center / cover no-repeat',
    artwork: '/themes/academic-studio.png',
  },
  {
    name: 'Neural Blueprint',
    note: 'AI · premium research · 5 layouts',
    bg: '06142B',
    bg2: '176BFF',
    ink: 'FFFFFF',
    accent: '29E6FF',
    canvas:
      'linear-gradient(90deg, rgba(6,20,43,.01), rgba(6,20,43,.08)), url(/themes/neural-blueprint.png) center / cover no-repeat',
    artwork: '/themes/neural-blueprint.png',
  },
  {
    name: 'Secure Grid',
    note: 'Cyber · executive',
    bg: '071117',
    bg2: '00B884',
    ink: 'F6FFFC',
    accent: '7CFFCF',
    canvas:
      'linear-gradient(135deg, transparent 0 72%, rgba(0,184,132,.22) 72%), repeating-linear-gradient(90deg, rgba(124,255,207,.07) 0 1px, transparent 1px 48px), #071117',
  },
  {
    name: 'Digital Forensics',
    note: 'Cyber · investigation · 5 layouts',
    bg: '06111D',
    bg2: '0A4B71',
    ink: 'F6FBFF',
    accent: 'F4A340',
    canvas:
      'linear-gradient(90deg, rgba(6,17,29,.01), rgba(6,17,29,.08)), url(/themes/digital-forensics.png) center / cover no-repeat',
    artwork: '/themes/digital-forensics.png',
  },
  {
    name: 'STEM Workshop',
    note: 'Education · computer science · 5 layouts',
    bg: 'FBF6EA',
    bg2: '103A5B',
    ink: '162A3D',
    accent: 'E76F51',
    canvas:
      'linear-gradient(90deg, rgba(251,246,234,.02), rgba(251,246,234,.04)), url(/themes/stem-workshop.png) center / cover no-repeat',
    artwork: '/themes/stem-workshop.png',
  },
  {
    name: 'Cloud Security',
    note: 'Cyber · cloud infrastructure · 5 layouts',
    bg: '061A3A',
    bg2: '087CCF',
    ink: 'FFFFFF',
    accent: '46D9FF',
    canvas: 'url(/themes/cloud-security.png) center / cover no-repeat',
    artwork: '/themes/cloud-security.png',
  },
  {
    name: 'Cipher Exchange',
    note: 'Cyber · cryptography · 5 layouts',
    bg: '06224A',
    bg2: '0B6FE8',
    ink: 'FFFFFF',
    accent: 'F6D27A',
    canvas: 'url(/themes/cryptography.png) center / cover no-repeat',
    artwork: '/themes/cryptography.png',
  },
  {
    name: 'Data Current',
    note: 'AI · data science · 5 layouts',
    bg: '041A3D',
    bg2: '087ED1',
    ink: 'FFFFFF',
    accent: '41D7FF',
    canvas: 'url(/themes/data-science.png) center / cover no-repeat',
    artwork: '/themes/data-science.png',
  },
  {
    name: 'Linux Systems',
    note: 'Technology · open source · 5 layouts',
    bg: '11151A',
    bg2: '25302D',
    ink: 'FFFFFF',
    accent: '9DDF55',
    canvas: 'url(/themes/linux-systems.png) center / cover no-repeat',
    artwork: '/themes/linux-systems.png',
  },
  {
    name: 'Engineering Thesis',
    note: 'Education · engineering · 5 layouts',
    bg: 'F7F4EC',
    bg2: '274D70',
    ink: '1B3348',
    accent: 'D87919',
    canvas: 'url(/themes/engineering-thesis.png) center / cover no-repeat',
    artwork: '/themes/engineering-thesis.png',
  },
  {
    name: 'Medical Research',
    note: 'Education · health science · 5 layouts',
    bg: 'F7FCFB',
    bg2: '4BB9B3',
    ink: '173843',
    accent: 'E66F61',
    canvas: 'url(/themes/medical-research.png) center / cover no-repeat',
    artwork: '/themes/medical-research.png',
  },
  {
    name: 'Chemistry Lab',
    note: 'Education · science · 5 layouts',
    bg: '05314A',
    bg2: '087989',
    ink: 'FFFFFF',
    accent: 'F0AF4E',
    canvas: 'url(/themes/chemistry-lab.png) center / cover no-repeat',
    artwork: '/themes/chemistry-lab.png',
  },
  {
    name: 'History Archive',
    note: 'Education · humanities · 5 layouts',
    bg: 'E9D4AD',
    bg2: '6E2D2C',
    ink: '332519',
    accent: '8E3C35',
    canvas: 'url(/themes/history-archive.png) center / cover no-repeat',
    artwork: '/themes/history-archive.png',
  },
  {
    name: 'Finance Insight',
    note: 'Business · finance · 5 layouts',
    bg: '071923',
    bg2: '075E46',
    ink: 'FFFFFF',
    accent: 'E8C875',
    canvas: 'url(/themes/finance-insight.png) center / cover no-repeat',
    artwork: '/themes/finance-insight.png',
  },
  {
    name: 'Startup Momentum',
    note: 'Business · pitch deck · 5 layouts',
    bg: '090A0E',
    bg2: '246BFD',
    ink: 'FFFFFF',
    accent: 'FF8A3D',
    canvas: 'url(/themes/startup-momentum.png) center / cover no-repeat',
    artwork: '/themes/startup-momentum.png',
  },
  {
    name: 'Campaign Editorial',
    note: 'Marketing · creative campaign · 5 layouts',
    bg: 'F8F1E9',
    bg2: 'F0523A',
    ink: '211E1D',
    accent: '135ED8',
    canvas: 'url(/themes/campaign-editorial.png) center / cover no-repeat',
    artwork: '/themes/campaign-editorial.png',
  },
  {
    name: 'Architecture Portfolio',
    note: 'Creative · architecture · 5 layouts',
    bg: 'F2EFE9',
    bg2: 'B66D4D',
    ink: '2B2A29',
    accent: '7B8F77',
    canvas: 'url(/themes/architecture-portfolio.png) center / cover no-repeat',
    artwork: '/themes/architecture-portfolio.png',
  },
  {
    name: 'Sustainability Report',
    note: 'Business · environment · 5 layouts',
    bg: 'F4F4E9',
    bg2: '45664D',
    ink: '203329',
    accent: 'B8953F',
    canvas: 'url(/themes/sustainability-report.png) center / cover no-repeat',
    artwork: '/themes/sustainability-report.png',
  },
];

const styleMeta: Record<string, { category: string; tags: string }> = {
  'Ocean Discovery': {
    category: 'Education',
    tags: 'ocean marine science biology nature environment school coral turtle sea underwater',
  },
  'Space Explorer': {
    category: 'Education',
    tags: 'space astronomy science planets physics school universe solar system',
  },
  'Classroom Stories': {
    category: 'Education',
    tags: 'school classroom teacher student lesson education books globe geography',
  },
  'Sports Performance': {
    category: 'Sports',
    tags: 'sport sports fitness athletics running health performance physical education',
  },
  Signal: { category: 'Technology', tags: 'tech digital software ai coding' },
  Editorial: { category: 'Business', tags: 'professional premium report' },
  Aura: { category: 'Creative', tags: 'art modern gradient' },
  Minimal: { category: 'Minimal', tags: 'clean simple white' },
  Horizon: { category: 'Marketing', tags: 'bright campaign colorful' },
  Matrix: {
    category: 'Cyber & AI',
    tags: 'code cyber cybersecurity hacker data grid security',
  },
  Gallery: { category: 'Creative', tags: 'academic art elegant museum' },
  Prism: { category: 'Creative', tags: 'colorful energetic' },
  Lecture: {
    category: 'Education',
    tags: 'school teacher lesson university classroom',
  },
  Monolith: { category: 'Business', tags: 'luxury executive black gold' },
  Skyline: { category: 'Business', tags: 'corporate professional blue' },
  Pop: { category: 'Marketing', tags: 'playful social campaign' },
  Chalkboard: {
    category: 'Education',
    tags: 'school classroom teacher chalk lesson',
  },
  Notebook: { category: 'Education', tags: 'school student notes paper' },
  'Science Lab': {
    category: 'Education',
    tags: 'school science stem chemistry technology',
  },
  Graduation: {
    category: 'Education',
    tags: 'university college graduation academic',
  },
  Primary: {
    category: 'Education',
    tags: 'school kids children elementary colorful',
  },
  Campus: { category: 'Education', tags: 'university academic college formal' },
  Market: { category: 'Business', tags: 'finance charts investment' },
  Launch: { category: 'Marketing', tags: 'startup pitch sales' },
  Wellness: { category: 'Business', tags: 'health medical calm' },
  Terrain: { category: 'Creative', tags: 'nature environment green' },
  Runway: { category: 'Marketing', tags: 'fashion editorial strategy' },
  Cyber: {
    category: 'Cyber & AI',
    tags: 'neon cybersecurity hacker security metaverse coding future',
  },
  'Security Ops': {
    category: 'Cyber & AI',
    tags: 'cyber cybersecurity soc operations command center blue team network',
  },
  'Zero Trust': {
    category: 'Cyber & AI',
    tags: 'cybersecurity zero trust enterprise identity access shield security',
  },
  'Threat Map': {
    category: 'Cyber & AI',
    tags: 'cybersecurity threat intelligence attack malware red team globe map',
  },
  Neural: {
    category: 'Cyber & AI',
    tags: 'ai artificial intelligence neural network machine learning nodes',
  },
  'AI Core': {
    category: 'Cyber & AI',
    tags: 'ai artificial intelligence futuristic technology machine learning core',
  },
  'Responsible AI': {
    category: 'Cyber & AI',
    tags: 'ai artificial intelligence ethics research university clean governance',
  },
  'Circuit Thesis': {
    category: 'Cyber & AI',
    tags: 'cybersecurity university project encryption circuits academic thesis',
  },
  'Academic Studio': {
    category: 'Education',
    tags: 'university project library books students illustrated academic',
  },
  'Neural Blueprint': {
    category: 'Cyber & AI',
    tags: 'ai artificial intelligence neural network premium research blueprint',
  },
  'Secure Grid': {
    category: 'Cyber & AI',
    tags: 'cybersecurity enterprise secure network grid executive green',
  },
  'Digital Forensics': {
    category: 'Cyber & AI',
    tags: 'cybersecurity forensics fingerprint evidence incident response investigation',
  },
  'STEM Workshop': {
    category: 'Education',
    tags: 'university school stem computer science coding laptop academic technology',
  },
  'Cloud Security': {
    category: 'Cyber & AI',
    tags: 'cloud security infrastructure network encryption cybersecurity',
  },
  'Cipher Exchange': {
    category: 'Cyber & AI',
    tags: 'cryptography encryption cipher keys cybersecurity mathematics',
  },
  'Data Current': {
    category: 'Cyber & AI',
    tags: 'ai data science analytics machine learning statistics research',
  },
  'Linux Systems': {
    category: 'Technology',
    tags: 'linux open source operating system kernel terminal software computer science',
  },
  'Engineering Thesis': {
    category: 'Education',
    tags: 'university engineering thesis mechanical blueprint academic project',
  },
  'Medical Research': {
    category: 'Education',
    tags: 'medical health biology dna research science university',
  },
  'Chemistry Lab': {
    category: 'Education',
    tags: 'chemistry science laboratory stem university research',
  },
  'History Archive': {
    category: 'Education',
    tags: 'history humanities archive university culture academic',
  },
  'Finance Insight': {
    category: 'Business',
    tags: 'finance investment market analytics executive report',
  },
  'Startup Momentum': {
    category: 'Business',
    tags: 'startup pitch deck growth product investors business',
  },
  'Campaign Editorial': {
    category: 'Marketing',
    tags: 'marketing campaign brand editorial creative strategy',
  },
  'Architecture Portfolio': {
    category: 'Creative',
    tags: 'architecture portfolio design construction creative',
  },
  'Sustainability Report': {
    category: 'Business',
    tags: 'sustainability environment climate nature esg report',
  },
};

const clean = (value: string) =>
  value
    .trim()
    .replace(
      /^(create|make|build)\s+(a|an)?\s*(presentation|deck)?\s*(about|on|for)?\s*/i,
      '',
    )
    .split(/[.!?]/)[0] || 'Your presentation';
const makeOutline = (topic: string, count: number, goal: string) => {
  const subject = clean(topic);
  const library = [
    `Why ${subject} matters now`,
    'The current challenge',
    'What the data tells us',
    'The opportunity',
    'A practical approach',
    'How to make it happen',
    'Risks and how to reduce them',
    'The action plan',
  ];
  return Array.from({ length: count }, (_, i) =>
    i === 0
      ? subject
      : i === count - 1
        ? `${goal} — next steps`
        : library[(i - 1) % library.length],
  );
};
const makeSlides = (
  outline: string[],
  audience: string,
  tone: string,
): Slide[] =>
  outline.map((title, i) => ({
    title,
    type: i === 0 ? 'cover' : i === outline.length - 1 ? 'closing' : 'content',
    body:
      i === 0
        ? `A ${tone.toLowerCase()} story designed for ${audience.toLowerCase()}.`
        : i === outline.length - 1
          ? 'Turn the decision into a clear, owned next step.'
          : `A focused point that helps ${audience.toLowerCase()} understand the decision and act with confidence.`,
    bullets:
      i === 0
        ? []
        : i === outline.length - 1
          ? [
              'Choose an owner',
              'Agree the first milestone',
              'Review the outcome',
            ]
          : [
              'Lead with the insight, not the process',
              'Use one proof point people remember',
              'Make the action unmistakably clear',
            ],
  }));
const readImage = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('Could not read logo'));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
const readImageUrl = async (url: string) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok)
    throw new Error('Could not load the selected theme artwork.');
  const blob = await response.blob();
  return readImage(new File([blob], 'theme.png', { type: blob.type }));
};

export default function Home() {
  const [stage, setStage] = useState<Stage>('brief');
  const [topic, setTopic] = useState('How small teams can use AI to save time');
  const [generationMode, setGenerationMode] =
    useState<GenerationMode>('research');
  const [audience, setAudience] = useState('Leadership team');
  const [goal, setGoal] = useState('Agree on a 30-day plan');
  const [tone, setTone] = useState('Confident and clear');
  const [count, setCount] = useState(7);
  const [outline, setOutline] = useState(() =>
    makeOutline(
      'How small teams can use AI to save time',
      7,
      'Agree on a 30-day plan',
    ),
  );
  const [styleIndex, setStyleIndex] = useState(0);
  const [slides, setSlides] = useState(() =>
    makeSlides(
      makeOutline(
        'How small teams can use AI to save time',
        7,
        'Agree on a 30-day plan',
      ),
      'Leadership team',
      'Confident and clear',
    ),
  );
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [deckCreated, setDeckCreated] = useState(false);
  const [sources, setSources] = useState<string[]>([]);
  const [researchSources, setResearchSources] = useState<
    Array<{ title: string; url: string }>
  >([]);
  const [aiDraft, setAiDraft] = useState<Slide[] | null>(null);
  const [generationError, setGenerationError] = useState('');
  const [logo, setLogo] = useState<Logo | null>(null);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>('top-right');
  const [logoSize, setLogoSize] = useState(13);
  const [customBackground, setCustomBackground] = useState<Logo | null>(null);
  const [useCustomBackground, setUseCustomBackground] = useState(false);
  const [reference, setReference] = useState<ReferenceDeck | null>(null);
  const [useReference, setUseReference] = useState(false);
  const [researchTopic, setResearchTopic] = useState('');
  const style: Style =
    useReference && reference
      ? {
          name: reference.name,
          note: 'Imported theme',
          bg: reference.bg,
          bg2: reference.accent,
          ink: reference.ink,
          accent: reference.accent,
          font: reference.font,
          canvas: `linear-gradient(135deg, #${reference.bg}, #${reference.bg})`,
        }
      : styles[styleIndex];
  const current = slides[selected] ?? slides[0];
  const step = { brief: 1, outline: 2, design: 3, deck: 4 }[stage];
  const generateOutline = async () => {
    setLoading(true);
    setGenerationError('');
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        signal: AbortSignal.timeout(185000),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: generationMode,
          topic,
          audience,
          goal,
          tone,
          count,
          researchTopic,
        }),
      });
      const data = (await response.json().catch(() => ({
        error: 'The AI service did not respond correctly. Please try again.',
      }))) as {
        slides?: Slide[];
        sources?: Array<{ title: string; url: string }>;
        error?: string;
      };
      if (!response.ok || !data.slides)
        throw new Error(data.error || 'The AI could not create this deck.');
      setAiDraft(data.slides);
      setCount(data.slides.length);
      if (!deckCreated && !useReference && !useCustomBackground) {
        const match = rankThemes(
          styles.map((item) => ({ ...item, ...styleMeta[item.name] })),
          topic,
        )[0];
        if (match?.score > 0) setStyleIndex(match.index);
      }
      setDeckCreated(false);
      setOutline(data.slides.map((slide) => slide.title));
      setResearchSources(data.sources ?? []);
      setStage('outline');
    } catch (error) {
      setGenerationError(
        error instanceof Error &&
          (error.name === 'TimeoutError' || error.name === 'AbortError')
          ? 'The AI took too long this time. Please try again—your topic has been kept.'
          : error instanceof Error
            ? error.message
            : 'The AI could not create this deck.',
      );
    } finally {
      setLoading(false);
    }
  };
  const buildDeck = () => {
    setSlides(
      deckCreated
        ? reconcileSlides(slides, outline)
        : aiDraft && aiDraft.length === outline.length
          ? reconcileSlides(aiDraft, outline)
          : makeSlides(outline, audience, tone),
    );
    if (!deckCreated) setSelected(0);
    setDeckCreated(true);
    setStage('deck');
  };
  const updateCurrent = (patch: Partial<Slide>) => {
    setSlides((items) =>
      items.map((item, i) => (i === selected ? { ...item, ...patch } : item)),
    );
    if (patch.title !== undefined)
      setOutline((items) =>
        items.map((item, i) => (i === selected ? patch.title! : item)),
      );
  };
  const exportDeck = async () => {
    if (exporting) return;
    setExporting(true);
    setExportError('');
    try {
      const { default: PptxGenJS } = await import('pptxgenjs');
      const pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_WIDE';
      pptx.author = 'Decksmith';
      pptx.title = clean(topic);
      const themeArtwork =
        style.artwork && !(customBackground && useCustomBackground)
          ? await readImageUrl(style.artwork)
          : null;
      const exportInk =
        customBackground && useCustomBackground ? 'FFFFFF' : style.ink;
      const exportAccent =
        customBackground && useCustomBackground ? '53F7D2' : style.accent;
      const exportTheme = { ...style, ink: exportInk, accent: exportAccent };
      slides.forEach((slide, i) => {
        const page = pptx.addSlide();
        page.background = { color: style.bg };
        const background =
          customBackground && useCustomBackground
            ? customBackground.data
            : themeArtwork;
        if (background)
          page.addImage({
            data: background,
            x: 0,
            y: 0,
            w: 13.333,
            h: 7.5,
            sizing: { type: 'cover', x: 0, y: 0, w: 13.333, h: 7.5 },
          });
        for (const node of createSlideScene(
          slide,
          exportTheme,
          i,
          logo ? { position: logoPosition, size: logoSize } : null,
        )) {
          if (node.kind === 'rect')
            page.addShape(pptx.ShapeType.rect, {
              x: node.x,
              y: node.y,
              w: node.w,
              h: node.h,
              fill: {
                color: node.fill!,
                transparency: (1 - (node.opacity ?? 1)) * 100,
              },
              line: { transparency: 100 },
            });
          else
            page.addText(node.text ?? '', {
              x: node.x,
              y: node.y,
              w: node.w,
              h: node.h,
              fontSize: node.size,
              fontFace: node.font || 'Arial',
              bold: node.bold,
              color: node.color,
              margin: 0,
              breakLine: false,
              fit: 'shrink',
              valign: 'top',
            });
        }
        if (logo) {
          const w = (13.333 * logoSize) / 100,
            h = w * 0.55,
            x = logoPosition.endsWith('left') ? 0.666 : 12.667 - w,
            y = logoPosition.startsWith('top') ? 0.3 : 7.2 - h;
          page.addShape(pptx.ShapeType.rect, {
            x,
            y,
            w,
            h,
            fill: { color: 'FFFFFF' },
            line: { transparency: 100 },
          });
          page.addImage({
            data: logo.data,
            x,
            y,
            w,
            h,
            sizing: { type: 'contain', x, y, w, h },
          });
        }
        if (researchSources.length)
          page.addNotes(
            '[Research sources — verify claims before presenting]\n' +
              researchSources
                .map(
                  (source, index) =>
                    `${index + 1}. ${source.title} — ${source.url}`,
                )
                .join('\n'),
          );
      });
      const blob = (await pptx.write({ outputType: 'blob' })) as Blob;
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${clean(topic)
        .replace(/[^a-z0-9]+/gi, '-')
        .toLowerCase()}.pptx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 60000);
    } catch (error) {
      setExportError(
        error instanceof Error
          ? `Download failed: ${error.message}. Please try again.`
          : 'Download failed. Please try again.',
      );
    } finally {
      setExporting(false);
    }
  };
  return (
    <main className="min-h-screen bg-[#f5f5f8] text-[#171923]">
      <header className="flex h-[68px] items-center justify-between border-b border-white/8 bg-[#0d0f14] px-5 text-white sm:px-7">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-[11px] bg-gradient-to-br from-[#8a72ff] to-[#5035d8]">
            <WandSparkles className="size-4" />
          </span>
          <span className="font-semibold tracking-[-.03em]">Decksmith</span>
          <Badge className="ml-2 border-0 bg-white/10 text-[9px] text-white/65">
            AI PRESENTATION STUDIO
          </Badge>
        </div>
        {stage === 'deck' && (
          <Button
            onClick={exportDeck}
            disabled={exporting}
            className="bg-white text-[#15161d] hover:bg-white/90"
          >
            {exporting ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Download />
            )}{' '}
            Export PowerPoint
          </Button>
        )}
      </header>
      <div className="mx-auto max-w-[1260px] px-5 py-8 lg:px-8">
        <div className="mb-8 flex items-center gap-2 overflow-x-auto">
          {['Brief', 'Outline', 'Design', 'Deck'].map((name, i) => (
            <div key={name} className="flex items-center gap-2">
              <button
                type="button"
                disabled={!canVisitStage(i, Boolean(aiDraft), deckCreated)}
                aria-current={step === i + 1 ? 'step' : undefined}
                onClick={() =>
                  i === 3
                    ? buildDeck()
                    : setStage(
                        (['brief', 'outline', 'design', 'deck'] as Stage[])[i],
                      )
                }
                className="flex items-center gap-2 rounded-lg p-1 focus-visible:outline-2 focus-visible:outline-[#6246ea] disabled:cursor-not-allowed"
              >
                <span
                  className={`grid size-7 place-items-center rounded-full text-[10px] font-bold ${step > i ? 'bg-[#654ae4] text-white' : 'bg-[#e5e5eb] text-black/35'}`}
                >
                  {step > i + 1 ? <Check className="size-3" /> : i + 1}
                </span>
                <span
                  className={`text-xs font-semibold ${step === i + 1 ? 'text-[#3e2d9c]' : 'text-black/35'}`}
                >
                  {name}
                </span>
              </button>
              {i < 3 && <span className="mx-2 h-px w-8 bg-black/10" />}
            </div>
          ))}
        </div>
        {stage === 'brief' && (
          <Brief
            topic={topic}
            setTopic={setTopic}
            generationMode={generationMode}
            setGenerationMode={setGenerationMode}
            audience={audience}
            setAudience={setAudience}
            goal={goal}
            setGoal={setGoal}
            tone={tone}
            setTone={setTone}
            count={count}
            setCount={setCount}
            sources={sources}
            setSources={setSources}
            logo={logo}
            setLogo={setLogo}
            reference={reference}
            setReference={(value) => {
              setReference(value);
              setUseReference(Boolean(value));
            }}
            researchTopic={researchTopic}
            setResearchTopic={setResearchTopic}
            loading={loading}
            generationError={generationError}
            generate={generateOutline}
          />
        )}
        {stage === 'outline' && (
          <Outline
            loading={loading}
            error={generationError}
            outline={outline}
            setOutline={setOutline}
            back={() => setStage('brief')}
            next={() => setStage('design')}
            regenerate={generateOutline}
          />
        )}
        {stage === 'design' && (
          <Design
            topic={topic}
            draftSlides={reconcileSlides(
              deckCreated ? slides : (aiDraft ?? slides),
              outline,
            )}
            reference={reference}
            useReference={useReference}
            setUseReference={setUseReference}
            styleIndex={styleIndex}
            setStyleIndex={(index) => {
              setStyleIndex(index);
              setUseReference(false);
              setUseCustomBackground(false);
            }}
            customBackground={customBackground}
            setCustomBackground={setCustomBackground}
            useCustomBackground={useCustomBackground}
            setUseCustomBackground={setUseCustomBackground}
            back={() => setStage('outline')}
            next={buildDeck}
          />
        )}
        {stage === 'deck' && (
          <Deck
            slides={slides}
            selected={selected}
            setSelected={setSelected}
            current={current}
            style={style}
            updateCurrent={updateCurrent}
            editBrief={() => setStage('brief')}
            changeStyle={() => setStage('design')}
            exportDeck={exportDeck}
            loading={exporting}
            exportError={exportError}
            tone={tone}
            audience={audience}
            logo={logo}
            logoPosition={logoPosition}
            setLogoPosition={setLogoPosition}
            logoSize={logoSize}
            setLogoSize={setLogoSize}
            customBackground={useCustomBackground ? customBackground : null}
            researchSources={researchSources}
          />
        )}
      </div>
    </main>
  );
}

function Brief({
  topic,
  setTopic,
  generationMode,
  setGenerationMode,
  audience,
  setAudience,
  goal,
  setGoal,
  tone,
  setTone,
  count,
  setCount,
  sources,
  setSources,
  logo,
  setLogo,
  loading,
  generationError,
  generate,
  reference,
  setReference,
  researchTopic,
  setResearchTopic,
}: {
  topic: string;
  setTopic: (x: string) => void;
  generationMode: GenerationMode;
  setGenerationMode: (x: GenerationMode) => void;
  audience: string;
  setAudience: (x: string) => void;
  goal: string;
  setGoal: (x: string) => void;
  tone: string;
  setTone: (x: string) => void;
  count: number;
  setCount: (x: number) => void;
  sources: string[];
  setSources: (x: string[]) => void;
  logo: Logo | null;
  setLogo: (x: Logo | null) => void;
  loading: boolean;
  generationError: string;
  generate: () => void;
  reference: ReferenceDeck | null;
  setReference: (value: ReferenceDeck | null) => void;
  researchTopic: string;
  setResearchTopic: (value: string) => void;
}) {
  const [fileError, setFileError] = useState('');
  const [fileBusy, setFileBusy] = useState(false);
  return (
    <section className="mx-auto max-w-[940px]">
      <Badge className="border-0 bg-[#eae6ff] text-[#6047dc]">
        CREATE WITH AI
      </Badge>
      <h1 className="mt-4 text-4xl font-semibold tracking-[-.055em] sm:text-5xl">
        Start with the story.
        <br />
        Let AI build the deck.
      </h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-6 text-black/52">
        Tell Decksmith who this is for and what needs to happen after the
        presentation. You approve the outline before we design anything.
      </p>
      <div className="mt-8 grid gap-5 rounded-[22px] border border-black/8 bg-white p-5 shadow-[0_16px_48px_rgba(27,28,37,.08)] sm:p-7">
        <div className="grid gap-3 sm:grid-cols-3">
          <button
            onClick={() => setGenerationMode('research')}
            className={`rounded-[16px] border p-4 text-left transition ${generationMode === 'research' ? 'border-[#6246ea] bg-[#f5f2ff] shadow-[0_0_0_3px_rgba(98,70,234,.10)]' : 'border-black/8 bg-white'}`}
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Search className="size-4 text-[#6246ea]" /> Research with AI
            </span>
            <span className="mt-1 block text-xs leading-5 text-black/45">
              Enter any topic—even one word. AI researches it and writes your
              slide content with sources.
            </span>
          </button>
          <button
            onClick={() => setGenerationMode('provided')}
            className={`rounded-[16px] border p-4 text-left transition ${generationMode === 'provided' ? 'border-[#6246ea] bg-[#f5f2ff] shadow-[0_0_0_3px_rgba(98,70,234,.10)]' : 'border-black/8 bg-white'}`}
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="size-4 text-[#6246ea]" /> Use my information
            </span>
            <span className="mt-1 block text-xs leading-5 text-black/45">
              Paste your notes, assignment instructions, required sections, and
              exact facts.
            </span>
          </button>
          <button
            onClick={() => setGenerationMode('hybrid')}
            className={`rounded-[16px] border p-4 text-left ${generationMode === 'hybrid' ? 'border-[#6246ea] bg-[#f5f2ff]' : 'border-black/8 bg-white'}`}
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="size-4 text-[#6246ea]" /> My information +
              research
            </span>
            <span className="mt-1 block text-xs leading-5 text-black/45">
              Keep your facts and instructions. Research the missing information
              with sources.
            </span>
          </button>
        </div>
        {generationMode === 'hybrid' && (
          <label
            htmlFor="research-subject"
            className="grid gap-2 text-xs font-semibold"
          >
            Topic to research
            <Input
              id="research-subject"
              value={researchTopic}
              onChange={(event) => setResearchTopic(event.target.value)}
              placeholder="For example: Linux architecture and security"
            />
          </label>
        )}
        <section>
          <label
            htmlFor="presentation-topic"
            className="text-[11px] font-bold uppercase tracking-[.13em] text-black/48"
          >
            {generationMode === 'research'
              ? 'What topic should the AI research?'
              : 'Paste your information and instructions'}
          </label>
          <Textarea
            id="presentation-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={
              generationMode === 'research'
                ? 'Animals, Linux, space, science… Just an idea is enough. Add details only if you want a specific direction.'
                : 'Example: Slide 1: Linux title and student names. Slide 2: Introduction. Slide 3: Architecture. Slide 4: Security. Slide 5: Conclusion...'
            }
            className="mt-2 min-h-40 resize-y rounded-[14px] border-black/10 p-4 text-[15px]"
          />
          {generationMode === 'research' && (
            <p className="mt-3 text-xs leading-5 text-black/52">
              No notes needed. Enter an idea, choose your slide count, and AI
              will research, write, and organize the content. You can review the
              outline and compare template examples before exporting.
            </p>
          )}
          {generationMode !== 'research' && (
            <div className="mt-3 rounded-xl border border-[#6246ea]/15 bg-[#f7f5ff] px-4 py-3 text-xs leading-5 text-black/52">
              <span className="font-semibold text-[#4b35bd]">
                Smart slide order:
              </span>{' '}
              Write “Slide 1,” “Slide 2,” and so on. Decksmith keeps every item
              in the requested position and intelligently completes the content.
            </div>
          )}
        </section>
        <div className="grid gap-4 sm:grid-cols-2">
          <Pick
            label="Audience"
            value={audience}
            setValue={setAudience}
            options={[
              'Leadership team',
              'Teachers',
              'University faculty',
              'Investors',
              'Customers',
              'Students',
            ]}
          />
          <Pick
            label="Goal"
            value={goal}
            setValue={setGoal}
            options={[
              'Agree on a 30-day plan',
              'Get approval',
              'Educate the team',
              'Close the deal',
            ]}
          />
          <Pick
            label="Writing tone"
            value={tone}
            setValue={setTone}
            options={[
              'Confident and clear',
              'Bold and visionary',
              'Friendly and simple',
              'Formal and analytical',
            ]}
          />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.13em] text-black/48">
              Slides
            </p>
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-black/10 p-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setCount(Math.max(4, count - 1))}
                aria-label="Remove one slide"
              >
                <ChevronLeft />
              </Button>
              <span className="min-w-10 text-center text-xl font-semibold">
                {count}
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setCount(Math.min(15, count + 1))}
                aria-label="Add one slide"
              >
                <ChevronRight />
              </Button>
              <span className="ml-auto text-xs text-black/36">4–15 slides</span>
            </div>
          </div>
        </div>
        <ReferenceUpload
          reference={reference}
          onReference={setReference}
          onUseText={(text) => {
            setTopic(text);
            setGenerationMode('provided');
          }}
          onLogo={setLogo}
        />
        <label
          htmlFor="supporting-files"
          className="flex cursor-pointer items-center gap-3 rounded-[13px] border border-dashed border-black/14 px-4 py-3 text-sm text-black/55"
        >
          <ImagePlus className="size-4 text-[#6246ea]" />
          <span>
            {sources.length
              ? `${sources.length} supporting file${sources.length > 1 ? 's' : ''} ready`
              : 'Read notes from a text or Markdown file'}
          </span>
          <input
            id="supporting-files"
            className="sr-only"
            type="file"
            multiple
            accept=".txt,.md"
            disabled={fileBusy}
            onChange={async (e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = '';
              setFileError('');
              setFileBusy(true);
              try {
                if (
                  files.some(
                    (file) =>
                      file.size > 16000 || !/\.(txt|md)$/i.test(file.name),
                  )
                )
                  throw new Error('Choose text or Markdown files under 16 KB.');
                const text = (
                  await Promise.all(files.map((file) => file.text()))
                ).join('\n\n');
                if (topic.length + text.length > 16000)
                  throw new Error(
                    'Combined notes exceed 16,000 characters. Shorten your notes first.',
                  );
                setTopic(topic + '\n\n' + text);
                setSources(files.map((file) => file.name));
                setGenerationMode('provided');
              } catch (error) {
                setFileError((error as Error).message);
              } finally {
                setFileBusy(false);
              }
            }}
          />
        </label>
        {fileError && (
          <p role="alert" className="text-xs text-red-700">
            {fileError}
          </p>
        )}
        <label
          htmlFor="university-logo"
          className="flex cursor-pointer items-center gap-3 rounded-[13px] border border-dashed border-[#6246ea]/25 bg-[#f7f5ff] px-4 py-3 text-sm text-[#5141a5]"
        >
          <span className="grid size-9 place-items-center overflow-hidden rounded-lg bg-white shadow-sm">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo.data}
                alt="University logo preview"
                className="h-full w-full object-contain p-1"
              />
            ) : (
              <ImagePlus className="size-4" />
            )}
          </span>
          <span>
            {logo
              ? `${logo.name} will appear on every slide`
              : 'Add university or organization logo'}
          </span>
          <input
            id="university-logo"
            className="sr-only"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (file)
                setLogo({ name: file.name, data: await readImage(file) });
            }}
          />
        </label>
        <Button
          onClick={generate}
          disabled={
            !topic.trim() ||
            loading ||
            fileBusy ||
            (generationMode === 'hybrid' && !researchTopic.trim())
          }
          className="h-12 rounded-[13px] bg-[#6246ea] px-6 shadow-[0_12px_28px_rgba(98,70,234,.25)]"
        >
          {loading ? <LoaderCircle className="animate-spin" /> : <Sparkles />}{' '}
          {generationMode === 'research'
            ? 'Research and create outline'
            : generationMode === 'hybrid'
              ? 'Combine my notes with research'
              : 'Create outline from my information'}
        </Button>
        {loading && (
          <p role="status" className="text-xs leading-5 text-[#6047dc]">
            {generationMode === 'provided'
              ? 'Organizing your information and checking slide length…'
              : 'Researching your topic, writing the slides, and checking that the text fits…'}{' '}
            Long drafts are rewritten automatically. This can take up to three
            minutes.
          </p>
        )}
        {generationError && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700"
          >
            {generationError}
          </p>
        )}
        <p className="text-[11px] text-black/36">
          Powered by Ollama Cloud. Research mode uses live web results; provided
          mode stays focused on the information you enter.
        </p>
      </div>
    </section>
  );
}
function Outline({
  loading,
  error,
  outline,
  setOutline,
  back,
  next,
  regenerate,
}: {
  outline: string[];
  loading: boolean;
  error: string;
  setOutline: (x: string[]) => void;
  back: () => void;
  next: () => void;
  regenerate: () => void;
}) {
  return (
    <section className="mx-auto max-w-[940px]">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Badge className="border-0 bg-[#eae6ff] text-[#6047dc]">
            STEP 2 · OUTLINE
          </Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.05em]">
            Shape the story before the design.
          </h1>
          <p className="mt-2 text-sm text-black/48">
            Edit any slide title, then approve the narrative.
          </p>
        </div>
        <Button variant="outline" onClick={regenerate} disabled={loading}>
          {loading ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}{' '}
          Regenerate
        </Button>
      </div>
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700"
        >
          {error}
        </p>
      )}
      <div className="mt-7 grid gap-2">
        {outline.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-[14px] border border-black/8 bg-white p-3"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#f0edff] text-[10px] font-bold text-[#6047dc]">
              {String(i + 1).padStart(2, '0')}
            </span>
            <input
              aria-label={`Title for slide ${i + 1}`}
              maxLength={120}
              value={item}
              onChange={(e) =>
                setOutline(
                  outline.map((value, index) =>
                    index === i ? e.target.value : value,
                  ),
                )
              }
              className="w-full bg-transparent text-sm font-medium outline-none"
            />
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-between">
        <Button variant="ghost" onClick={back}>
          <ArrowLeft /> Back
        </Button>
        <Button onClick={next} disabled={loading} className="bg-[#6246ea]">
          Approve outline <ArrowRight />
        </Button>
      </div>
    </section>
  );
}
function ThemeThumbnail({ item }: { item: Style }) {
  const meta = styleMeta[item.name];
  const isCyber = meta?.category === 'Cyber & AI';
  const isAcademic = meta?.category === 'Education';
  const isAi = /AI|Neural|Responsible/i.test(item.name);
  const Icon = isAi ? BrainCircuit : isCyber ? ShieldCheck : BookOpen;

  return (
    <div
      className="relative aspect-[16/9] overflow-hidden rounded-[12px] p-3"
      style={{ backgroundColor: `#${item.bg}`, color: `#${item.ink}` }}
    >
      <div className="grid h-full grid-cols-[1.45fr_.7fr] gap-1.5">
        <div
          className="relative overflow-hidden rounded-lg border border-white/15 shadow-sm"
          style={{ background: item.canvas }}
        >
          <span className="absolute left-[8%] top-[10%] text-[5px] font-bold uppercase tracking-[.12em] opacity-65">
            {isAcademic
              ? 'University project'
              : isCyber
                ? 'Tech briefing'
                : 'Presentation'}
          </span>
          <div className="absolute bottom-[12%] left-[8%] max-w-[58%]">
            <p className="text-[12px] font-semibold leading-[.92] tracking-[-.055em]">
              {item.name}
            </p>
            <div
              className="mt-1.5 h-[2px] w-7"
              style={{ backgroundColor: `#${item.accent}` }}
            />
          </div>
          <Icon
            className="absolute bottom-[12%] right-[8%] size-7 opacity-75"
            style={{ color: `#${item.accent}` }}
          />
        </div>
        <div className="grid grid-rows-2 gap-1.5">
          <div
            className="relative overflow-hidden rounded-md border border-white/15"
            style={{ background: item.canvas }}
          >
            <span className="absolute left-[10%] top-[12%] text-[4px] font-bold opacity-60">
              02
            </span>
            <span className="absolute left-[10%] top-[38%] h-[3px] w-[58%] rounded bg-current opacity-70" />
            <span className="absolute left-[10%] top-[54%] h-[2px] w-[72%] rounded bg-current opacity-25" />
            <span className="absolute left-[10%] top-[67%] h-[2px] w-[48%] rounded bg-current opacity-25" />
          </div>
          <div
            className="relative overflow-hidden rounded-md border border-white/15"
            style={{ background: item.canvas }}
          >
            <span className="absolute left-[10%] top-[14%] text-[4px] font-bold opacity-60">
              03
            </span>
            <span className="absolute bottom-[14%] left-[10%] top-[38%] w-[34%] rounded-sm border border-current/20 bg-black/10" />
            <span
              className="absolute bottom-[14%] right-[10%] top-[38%] w-[38%] rounded-sm"
              style={{ backgroundColor: `#${item.accent}55` }}
            />
          </div>
        </div>
      </div>
      {item.artwork && (
        <span className="absolute left-5 top-5 rounded-full bg-white/90 px-2 py-1 text-[6px] font-black uppercase tracking-[.12em] text-[#171923] shadow-sm">
          Original artwork
        </span>
      )}
    </div>
  );
}

function Design({
  topic,
  draftSlides,
  reference,
  useReference,
  setUseReference,
  styleIndex,
  setStyleIndex,
  customBackground,
  setCustomBackground,
  useCustomBackground,
  setUseCustomBackground,
  back,
  next,
}: {
  topic: string;
  draftSlides: Slide[];
  reference: ReferenceDeck | null;
  useReference: boolean;
  setUseReference: (value: boolean) => void;
  styleIndex: number;
  setStyleIndex: (x: number) => void;
  customBackground: Logo | null;
  setCustomBackground: (x: Logo | null) => void;
  useCustomBackground: boolean;
  setUseCustomBackground: (x: boolean) => void;
  back: () => void;
  next: () => void;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [recommendedFirst, setRecommendedFirst] = useState(false);
  const examples = rankThemes(
    styles.map((item) => ({ ...item, ...styleMeta[item.name] })),
    topic,
  ).slice(0, 6);
  const categories = [
    'All',
    'Cybersecurity',
    'AI',
    'School',
    'University',
    'Science',
    'Medical',
    'Technology',
    'Business',
    'Finance',
    'Marketing',
    'Creative',
    'Nature',
    'Sports',
    'Minimal',
  ];
  const categoryTerms: Record<string, string[]> = {
    Cybersecurity: [
      'cyber',
      'cybersecurity',
      'security',
      'encryption',
      'forensics',
      'threat',
      'trust',
    ],
    AI: ['ai', 'artificial intelligence', 'neural', 'machine learning', 'data'],
    School: ['school', 'teacher', 'classroom', 'student', 'kids', 'lesson'],
    University: [
      'university',
      'academic',
      'thesis',
      'college',
      'lecture',
      'graduation',
    ],
    Science: [
      'science',
      'stem',
      'chemistry',
      'biology',
      'engineering',
      'research',
    ],
    Medical: ['medical', 'health', 'biology', 'dna', 'wellness'],
    Technology: [
      'technology',
      'tech',
      'software',
      'linux',
      'coding',
      'digital',
    ],
    Business: ['business', 'corporate', 'executive', 'startup', 'report'],
    Finance: ['finance', 'investment', 'market', 'analytics'],
    Marketing: ['marketing', 'campaign', 'brand', 'sales', 'social'],
    Creative: ['creative', 'art', 'editorial', 'fashion', 'architecture'],
    Nature: ['nature', 'environment', 'sustainability', 'green', 'climate'],
    Sports: ['sport', 'fitness', 'athletics', 'running'],
    Minimal: ['minimal', 'clean', 'simple', 'white'],
  };
  const popularSearches = [
    'Astronomy',
    'Ocean',
    'Sports',
    'Science',
    'School',
    'University',
    'Chemistry',
    'Medical',
    'Engineering',
    'History',
    'Linux',
    'AI',
    'Cybersecurity',
    'Finance',
    'Sustainability',
  ];
  const visibleStyles = styles
    .map((item, index) => ({
      item,
      index,
      meta: styleMeta[item.name],
      ...matchTheme(
        { ...item, ...styleMeta[item.name] },
        query.trim() || topic,
      ),
    }))
    .filter(({ item, meta }) => {
      const search = query.trim().toLowerCase();
      const searchWords = search
        .split(/\s+/)
        .filter(
          (word) =>
            word &&
            !['theme', 'template', 'background', 'presentation'].includes(word),
        );
      const searchable =
        `${item.name} ${item.note} ${meta?.category ?? ''} ${meta?.tags ?? ''}`.toLowerCase();
      const matchesCategory =
        category === 'All' ||
        (categoryTerms[category] ?? []).some((term) =>
          searchable.includes(term),
        );
      const matchesSearch =
        !searchWords.length ||
        matchTheme({ ...item, ...meta }, search).score > 0;
      return matchesCategory && matchesSearch;
    })
    .sort(
      (a, b) =>
        (recommendedFirst || query.trim() ? b.score - a.score : 0) ||
        Number(Boolean(b.item.artwork)) - Number(Boolean(a.item.artwork)) ||
        a.index - b.index,
    );

  return (
    <section className="mx-auto max-w-[940px]">
      <Badge className="border-0 bg-[#eae6ff] text-[#6047dc]">
        STEP 3 · VISUAL DIRECTION
      </Badge>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-.05em]">
        Choose a template for your idea.
      </h1>
      <p className="mt-2 text-sm text-black/48">
        Each pack includes title, introduction, comparison, timeline, diagram,
        and conclusion layouts.
      </p>

      <TemplateExamples
        examples={examples}
        slides={draftSlides}
        onChoose={(index) => {
          setStyleIndex(index);
          next();
        }}
      />
      <h2 className="mt-8 text-lg font-semibold">
        Or explore the full theme library
      </h2>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4">
        <div>
          <p className="text-sm font-semibold text-[#4931ab]">
            {recommendedFirst
              ? 'Recommended for your presentation'
              : 'Browse all themes'}
          </p>
          <p className="mt-1 max-w-xl text-xs text-black/55">
            {recommendedFirst
              ? 'Topic matches appear first; all other themes remain available.'
              : 'Artwork packs first, with no topic preference.'}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setRecommendedFirst(!recommendedFirst)}
        >
          {recommendedFirst ? 'Browse all' : 'Recommended first'}
        </Button>
      </div>
      {reference && (
        <button
          onClick={() => {
            setUseReference(true);
            setUseCustomBackground(false);
          }}
          className={`mt-4 w-full rounded-xl border p-4 text-left ${useReference ? 'border-[#6246ea] bg-[#f5f2ff]' : 'border-black/10 bg-white'}`}
        >
          <span className="font-semibold">Use theme from {reference.name}</span>
          <span className="mt-1 block text-xs text-black/50">
            Imported colors and font with Decksmith’s editable layouts.{' '}
            {useReference ? 'Selected' : ''}
          </span>
        </button>
      )}
      <div className="relative mt-7">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-black/35" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search cybersecurity, AI, school, business..."
          aria-label="Search presentation themes"
          className="h-12 rounded-2xl border-black/10 bg-white pl-11 shadow-sm focus-visible:ring-[#6246ea]/30"
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[10px] font-bold uppercase tracking-[.12em] text-black/35">
          Try
        </span>
        {popularSearches.map((term) => (
          <button
            key={term}
            onClick={() => {
              setQuery(term);
              setCategory('All');
            }}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${query.toLowerCase() === term.toLowerCase() ? 'border-[#6246ea] bg-[#eeeaff] text-[#4c37b7]' : 'border-black/8 bg-white text-black/48 hover:border-[#6246ea]/40 hover:text-[#4c37b7]'}`}
          >
            {term}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-[18px] border border-[#6246ea]/16 bg-gradient-to-r from-[#f4f1ff] to-[#eef8ff] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#6246ea] text-white shadow-sm">
              <ImagePlus className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">Use your own background</p>
              <p className="text-xs text-black/42">
                Upload a PNG, JPG, or WebP and it will fill every slide.
              </p>
            </div>
          </div>
          <label
            htmlFor="custom-slide-background"
            className="cursor-pointer rounded-xl bg-[#171923] px-4 py-2.5 text-center text-xs font-semibold text-white"
          >
            {customBackground ? 'Replace background' : 'Upload background'}
            <input
              id="custom-slide-background"
              className="sr-only"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (file) {
                  setCustomBackground({
                    name: file.name,
                    data: await readImage(file),
                  });
                  setUseCustomBackground(true);
                  setUseReference(false);
                }
              }}
            />
          </label>
        </div>
        {customBackground && (
          <button
            onClick={() => setUseCustomBackground(true)}
            aria-label={`Use ${customBackground.name} as the slide background`}
            className={`mt-4 flex w-full items-center gap-3 rounded-xl border p-2 text-left ${useCustomBackground ? 'border-[#6246ea] bg-white shadow-[0_0_0_3px_rgba(98,70,234,.10)]' : 'border-black/8 bg-white/70'}`}
          >
            <span
              className="h-14 w-24 shrink-0 rounded-lg bg-cover bg-center"
              style={{ backgroundImage: `url(${customBackground.data})` }}
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                {customBackground.name}
              </span>
              <span className="text-xs text-black/42">
                {useCustomBackground
                  ? 'Selected for preview and PowerPoint export'
                  : 'Click to use this background'}
              </span>
            </span>
          </button>
        )}
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {categories.map((item) => (
          <button
            key={item}
            onClick={() => setCategory(item)}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${category === item ? 'border-[#6246ea] bg-[#6246ea] text-white' : 'border-black/8 bg-white text-black/55 hover:border-black/20'}`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-black/42">
        <span>
          {visibleStyles.length} theme{visibleStyles.length === 1 ? '' : 's'} ·{' '}
          {visibleStyles.filter(({ item }) => item.artwork).length} premium
          artwork packs
        </span>
        {(query || category !== 'All') && (
          <button
            onClick={() => {
              setQuery('');
              setCategory('All');
            }}
            className="font-semibold text-[#6246ea]"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleStyles.map(({ item, index, meta, score, reason }) => (
          <button
            key={item.name}
            aria-label={`Choose ${item.name} presentation style`}
            onClick={() => setStyleIndex(index)}
            className={`overflow-hidden rounded-[18px] border p-2 text-left transition hover:-translate-y-0.5 hover:shadow-md ${styleIndex === index && !useCustomBackground && !useReference ? 'border-[#6246ea] bg-white shadow-[0_0_0_3px_rgba(98,70,234,.12)]' : 'border-black/8 bg-white'}`}
          >
            <ThemeThumbnail item={item} />
            {recommendedFirst && !query.trim() && score > 0 && (
              <span className="mx-2 mt-2 inline-block rounded-full bg-[#eeeaff] px-2 py-1 text-[10px] font-semibold text-[#5138bb]">
                {reason}
              </span>
            )}
            <div className="px-2 pb-1 pt-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{item.name}</span>
                <span className="rounded-full bg-black/[.045] px-2 py-1 text-[9px] font-bold uppercase tracking-[.08em] text-black/42">
                  {meta?.category}
                </span>
              </div>
              <span className="mt-1 block text-xs text-black/38">
                {item.note.replace(/ · \d+ layouts/, '')} · 8 editable layouts
              </span>
            </div>
          </button>
        ))}
      </div>
      {visibleStyles.length === 0 && (
        <div className="mt-4 rounded-[20px] border border-dashed border-black/12 bg-white px-6 py-12 text-center">
          <p className="font-semibold">No themes found for “{query}”</p>
          <p className="mt-1 text-sm text-black/42">
            Try cybersecurity, AI, school, university, or business.
          </p>
        </div>
      )}
      <div className="mt-6 flex justify-between">
        <Button variant="ghost" onClick={back}>
          <ArrowLeft /> Back
        </Button>
        <Button onClick={next} className="bg-[#6246ea]">
          <Sparkles /> Create deck
        </Button>
      </div>
    </section>
  );
}
function Deck({
  slides,
  selected,
  setSelected,
  current,
  style,
  updateCurrent,
  editBrief,
  changeStyle,
  exportDeck,
  loading,
  exportError,
  tone,
  audience,
  logo,
  logoPosition,
  setLogoPosition,
  logoSize,
  setLogoSize,
  customBackground,
  researchSources,
}: {
  slides: Slide[];
  selected: number;
  setSelected: (x: number) => void;
  current: Slide;
  style: Style;
  updateCurrent: (patch: Partial<Slide>) => void;
  editBrief: () => void;
  changeStyle: () => void;
  exportDeck: () => void;
  loading: boolean;
  exportError: string;
  tone: string;
  audience: string;
  logo: Logo | null;
  logoPosition: LogoPosition;
  setLogoPosition: (x: LogoPosition) => void;
  logoSize: number;
  setLogoSize: (x: number) => void;
  customBackground: Logo | null;
  researchSources: Array<{ title: string; url: string }>;
}) {
  const bg = customBackground
    ? `url(${customBackground.data}) center / cover no-repeat`
    : style.canvas;
  const previewTheme = {
    ...style,
    ink: customBackground ? 'FFFFFF' : style.ink,
    accent: customBackground ? '53F7D2' : style.accent,
  };
  const issues = qualityIssues(
    slides,
    previewTheme,
    logo ? { position: logoPosition, size: logoSize } : null,
  );
  const layoutVariant = chooseLayout(current);
  return (
    <section className="grid gap-6 xl:grid-cols-[180px_minmax(0,1fr)_280px]">
      <div className="flex flex-wrap items-center justify-between gap-3 xl:col-span-3">
        <div>
          <h1 className="text-xl font-semibold">Your deck is ready to edit</h1>
          <p className="mt-1 text-xs text-black/50">
            Select a slide, edit its text, change the theme, or download. Edits
            stay in this session.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={editBrief}>
            <ArrowLeft /> Edit brief
          </Button>
          <Button variant="outline" onClick={changeStyle}>
            <LayoutTemplate /> Themes
          </Button>
          <Button onClick={exportDeck} disabled={loading}>
            {loading ? <LoaderCircle className="animate-spin" /> : <Download />}{' '}
            Download
          </Button>
        </div>
        {exportError && (
          <p
            role="alert"
            className="w-full rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {exportError}
          </p>
        )}
      </div>
      <aside className="max-h-52 overflow-y-auto rounded-[18px] border border-black/8 bg-white p-3 xl:max-h-[700px]">
        <p className="px-2 pb-3 text-[10px] font-bold uppercase tracking-[.13em] text-black/40">
          Your slides
        </p>
        {slides.map((slide, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Select slide ${i + 1}: ${slide.title}`}
            aria-pressed={selected === i}
            onClick={() => setSelected(i)}
            className={`mb-1 w-full rounded-xl p-2 text-left ${selected === i ? 'bg-[#efecff] text-[#4530b0]' : 'hover:bg-black/[.03]'}`}
          >
            <span className="text-[9px] font-bold opacity-45">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="mt-1 line-clamp-2 block text-[11px] font-semibold leading-tight">
              {slide.title}
            </span>
          </button>
        ))}
      </aside>
      <div className="min-w-0">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            aria-label="Previous slide"
            disabled={selected === 0}
            onClick={() => setSelected(selected - 1)}
          >
            <ChevronLeft /> Previous
          </Button>
          <span aria-live="polite" className="text-xs text-black/55">
            Slide {selected + 1} of {slides.length}
          </span>
          <Button
            variant="outline"
            aria-label="Next slide"
            disabled={selected === slides.length - 1}
            onClick={() => setSelected(selected + 1)}
          >
            Next <ChevronRight />
          </Button>
        </div>
        <SlideScene
          slide={current}
          theme={previewTheme}
          index={selected}
          background={bg}
          logo={
            logo
              ? { data: logo.data, position: logoPosition, size: logoSize }
              : null
          }
        />
        <div className="mt-4 rounded-xl border border-black/10 bg-white p-4">
          <p className="text-xs font-semibold">
            Layout options · your words stay unchanged
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {layouts.map((layout) => (
              <button
                type="button"
                key={layout}
                aria-pressed={layoutVariant === layout}
                aria-label={`Apply ${layout} layout`}
                onClick={() => updateCurrent({ layout })}
                className={`rounded-lg border p-1 text-left ${layoutVariant === layout ? 'border-[#6246ea] bg-[#f2efff]' : 'border-black/10'}`}
              >
                <div aria-hidden="true" className="pointer-events-none">
                  <SlideScene
                    slide={{ ...current, layout }}
                    theme={previewTheme}
                    index={selected}
                    background={bg}
                  />
                </div>
                <span className="block px-1 py-2 text-[11px] font-semibold capitalize">
                  {layout}
                </span>
              </button>
            ))}
          </div>
        </div>
        <details
          className="mt-4 rounded-xl border border-black/10 bg-white p-4"
          open={issues.length > 0}
        >
          <summary className="cursor-pointer text-xs font-semibold">
            Pre-export check:{' '}
            {issues.length
              ? `${issues.length} item(s) to review`
              : 'text fits the layout estimates'}
          </summary>
          <p className="mt-2 text-xs text-black/50">
            Checks text density and missing content. Always review facts, fonts,
            and your downloaded slides.
          </p>
          {issues.map((issue, i) => (
            <button
              key={i}
              className="mt-2 block text-left text-xs text-amber-800 underline"
              onClick={() => setSelected(issue.slide)}
            >
              Slide {issue.slide + 1}: {issue.message}
            </button>
          ))}
        </details>
      </div>
      <aside className="rounded-[18px] border border-black/8 bg-white p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-[#6246ea]" />
          <p className="text-sm font-semibold">Edit slide {selected + 1}</p>
        </div>
        <p className="mt-2 text-xs leading-5 text-black/46">
          Changes appear immediately in the preview and your PowerPoint
          download.
        </p>
        <div className="mt-4 grid gap-3">
          <label
            htmlFor="deck-slide-title"
            className="grid gap-1.5 text-xs font-semibold"
          >
            Slide title
            <Input
              id="deck-slide-title"
              value={current.title}
              maxLength={120}
              onChange={(event) => updateCurrent({ title: event.target.value })}
            />
          </label>
          <label
            htmlFor="deck-slide-body"
            className="grid gap-1.5 text-xs font-semibold"
          >
            Description
            <Textarea
              id="deck-slide-body"
              className="min-h-24"
              value={current.body}
              maxLength={420}
              onChange={(event) => updateCurrent({ body: event.target.value })}
            />
          </label>
          <label
            htmlFor="deck-slide-bullets"
            className="grid gap-1.5 text-xs font-semibold"
          >
            Bullet points · one per line
            <Textarea
              id="deck-slide-bullets"
              className="min-h-32"
              value={current.bullets.join('\n')}
              onChange={(event) =>
                updateCurrent({
                  bullets: event.target.value
                    .split('\n')
                    .slice(0, 4)
                    .map((line) => line.slice(0, 180)),
                })
              }
            />
          </label>
        </div>
        <Button variant="outline" onClick={changeStyle} className="mt-2 w-full">
          <LayoutTemplate /> Change style
        </Button>
        {logo && (
          <div className="mt-5 rounded-xl border border-black/8 bg-[#f8f8fa] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[.12em] text-black/42">
              Logo placement
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {(
                [
                  'top-left',
                  'top-right',
                  'bottom-left',
                  'bottom-right',
                ] as LogoPosition[]
              ).map((position) => (
                <button
                  key={position}
                  onClick={() => setLogoPosition(position)}
                  className={`rounded-lg border px-2 py-2 text-[9px] font-semibold capitalize ${logoPosition === position ? 'border-[#6246ea] bg-[#ece8ff] text-[#4b35bd]' : 'border-black/8 bg-white text-black/45'}`}
                >
                  {position.replace('-', ' ')}
                </button>
              ))}
            </div>
            <label
              htmlFor="logo-size"
              className="mt-3 block text-[10px] font-semibold text-black/45"
            >
              Logo size
            </label>
            <input
              id="logo-size"
              type="range"
              min="8"
              max="22"
              value={logoSize}
              onChange={(event) => setLogoSize(Number(event.target.value))}
              className="mt-1 w-full accent-[#6246ea]"
            />
          </div>
        )}
        <div className="my-5 h-px bg-black/8" />
        <p className="text-[10px] font-bold uppercase tracking-[.13em] text-black/40">
          Deck settings
        </p>
        <p className="mt-3 text-xs text-black/55">
          {slides.length} slides · {tone}
        </p>
        <p className="mt-1 text-xs text-black/55">For {audience}</p>
        <p className="mt-1 text-xs text-black/55">
          Brand: {logo ? logo.name : 'No logo'}
        </p>
        <p className="mt-1 text-xs text-black/55">
          Background: {customBackground ? customBackground.name : style.name}
        </p>
        {researchSources.length > 0 && (
          <p className="mt-1 text-xs text-[#4b35bd]">
            {researchSources.length} research sources added to speaker notes
          </p>
        )}
        <Button
          onClick={exportDeck}
          disabled={loading}
          className="mt-5 w-full bg-[#6246ea]"
        >
          {loading ? <LoaderCircle className="animate-spin" /> : <Download />}{' '}
          Download .pptx
        </Button>
      </aside>
    </section>
  );
}
function Pick({
  label,
  value,
  setValue,
  options,
}: {
  label: string;
  value: string;
  setValue: (x: string) => void;
  options: string[];
}) {
  const id = `field-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  return (
    <div>
      <label
        htmlFor={id}
        className="text-[11px] font-bold uppercase tracking-[.13em] text-black/48"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:border-[#6246ea]"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}
