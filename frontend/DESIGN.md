# DESIGN.md — DAPEN Frontend Design System

## Overview

This document defines the unified visual language and interaction patterns for the DAPEN frontend. All new pages, components, and features MUST follow these conventions. Deviations require a DRR (Design Rationale Review) before merge.

---

## Page Structure Patterns

### 1. Two-Panel Layout (Master-Detail)

Used for: **config-logs**, **dynamic-browse**, **laporan-dinamis**

```
┌─────────────────────────────────────────────────────────┐
│ [Sidebar]        │ [Main Content Area]                 │
│                  │                                    │
│ ┌──────────────┐ │ ┌────────────────────────────────┐│
│ │ Title + New  │ │ │ Header: Icon + Title + Actions   ││
│ │ ┌──────────┐ │ │ ├────────────────────────────────┤│
│ │ │Search    │ │ │ Tabs: [A] [B] [C]               ││
│ │ └──────────┘ │ │ ├────────────────────────────────┤│
│ │              │ │ │                                ││
│ │ ┌──────────┐ │ │ │  Content Area (scrollable)     ││
│ │ │ List Item│ │ │ │                                ││
│ │ │ (active) │ │ │ │                                ││
│ │ ├──────────┤ │ │ │                                ││
│ │ │ List Item│ │ │ │                                ││
│ │ └──────────┘ │ │ └────────────────────────────────┘│
│ └──────────────┘ │                                    │
└─────────────────────────────────────────────────────────┘
```

```tsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
  {/* Sidebar */}
  <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 dark:shadow-2xl overflow-hidden p-4">
    <h3 className={`font-bold mb-4 px-2 ${isDark ? "text-slate-200" : "text-slate-700"}`}>Title</h3>
    {/* Search */}
    <div className="relative mb-4 px-2">
      <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <Input className="pl-9 h-9 bg-white dark:bg-slate-950 ..." />
    </div>
    {/* Scrollable list */}
    <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
      <Each of={filteredItems}>
        {(item) => (
          <button
            onClick={() => setSelected(item.id)}
            className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              selectedId === item.id
                ? isDark ? "bg-primary-600 text-white" : "bg-primary-600 text-white shadow-md shadow-primary-500/20"
                : isDark ? "text-slate-400 hover:bg-slate-700/50" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {item.name}
          </button>
        )}
      </Each>
    </div>
  </div>

  {/* Main content */}
  <div className="md:col-span-3">
    <div className="bg-white dark:bg-[#0f172a] rounded-3xl ...">
      {/* ... */}
    </div>
  </div>
</div>
```

### 2. Single Card Layout (Toolbar + Table)

Used for: **activity-logs**, **menu**, **kasbank**, **users**

```tsx
<div className="space-y-6">
  <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 dark:shadow-2xl overflow-hidden">
    {/* Toolbar / Filter Bar */}
    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex w-full sm:w-auto items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input className="pl-9 h-9 bg-white dark:bg-slate-950 rounded-r-none border-r-0 ..." />
        </div>
        <Button variant="secondary" size="sm" className="rounded-l-none rounded-r-xl h-9 px-6 ...">Search</Button>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />Add New
        </Button>
      </div>
    </div>

    {/* Table */}
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Column</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <Show when={!isLoading} fallback={<SkeletonRows />}>
            <Each of={items} fallback={<EmptyRow colSpan={6} />}>
              {(item) => <TableRow>...</TableRow>}
            </Each>
          </Show>
        </TableBody>
      </Table>
    </div>

    {/* Pagination */}
    <div className={`p-4 border-t ${isDark ? "border-slate-700/50" : "border-slate-200"}`}>
      {renderPagination({ totalPages, totalItems })}
    </div>
  </div>
</div>
```

### 3. Tab-Based Settings Layout

Used for: **perusahaan** (settings with sub-sections)

```tsx
<Tabs tabs={tabItems} defaultValue="company" />
```

### 4. Full-Page Auth Layout

Used for: **login**

```tsx
// Animated blob background, centered card, SVG password toggle
<div className="min-h-screen flex items-center justify-center relative overflow-hidden">
  {/* Animated gradient blobs */}
  <div className="absolute inset-0 -z-10">
    <div className="absolute top-1/4 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
    <div className="absolute top-1/4 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
  </div>
  {/* Card */}
  <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl ...">
    <Form>...</Form>
  </div>
</div>
```

---

## CSS Classes Reference

### Card Wrapper (Universal)

```tsx
// Standard card
<div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 dark:shadow-2xl overflow-hidden">

// Sidebar card (with internal padding)
<div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 dark:shadow-2xl overflow-hidden p-4">
```

### Grid Layouts

```tsx
// Two-panel: 1 column sidebar + 3 columns main
<div className="grid grid-cols-1 md:grid-cols-4 gap-6">

// Form: label left, field right (12-column)
<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
<div className="lg:col-span-5">...label...</div>
<div className="hidden lg:block w-[1px] bg-slate-200 dark:bg-slate-800 self-stretch" />
<div className="lg:col-span-6">...field...</div>

// Form: 2-column field grid
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
```

### Toolbar / Filter Bar

```tsx
<div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
```

### Table Wrapper

```tsx
<div className="overflow-x-auto">
```

### Pagination Area

```tsx
<div className={`p-4 border-t ${isDark ? "border-slate-700/50" : "border-slate-200"}`}>
```

### Search Input with Icon

```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
  <Input className="pl-9 h-9 bg-white dark:bg-slate-950 ..." />
</div>
```

### Scrollable List with Custom Scrollbar

```tsx
<div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
```

### Form Inputs

```tsx
// Height 9 (compact) or 10 (standard)
className="h-9 rounded-xl bg-white dark:bg-slate-950"

// Search bar input (sticky border-right: 0)
className="pl-9 h-9 bg-white dark:bg-slate-950 rounded-r-none border-r-0"

// Search button (remove left border radius to connect)
className="rounded-l-none rounded-r-xl h-9 px-6"
```

### Mono / Code Values

```tsx
className="font-mono text-sm"
```

---

## Component Patterns

### Badge Variants

```tsx
// Operation type badges (config-logs, activity-logs)
<Badge variant="success">CREATE (INSERT)</Badge>
<Badge variant="info">UPDATE</Badge>
<Badge variant="danger">DELETE</Badge>

// Count badges
<Badge variant="outline" className="ml-auto text-xs">{count}</Badge>

// Status badges (inline, compact)
<Badge variant="secondary" className="shrink-0 font-mono text-xs">
  {String(keyValue)}
</Badge>

// Active/Inactive toggle
<Badge variant="outline" className={report.status_aktif ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}>
  {report.status_aktif ? 'Aktif' : 'Nonaktif'}
</Badge>
```

### Each / Show (MANDATORY — no raw `.map()`, `&&`, or ternary)

```tsx
// Rendering arrays
<Each of={items} fallback={<TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">No data</TableCell></TableRow>}>
  {(item) => <TableRow>...</TableRow>}
</Each>

// Conditional rendering
<Show when={!isLoading} fallback={<SkeletonRows />}>
  <Each of={items}>{(item) => <TableRow>...</TableRow>}</Each>
</Show>
```

### Skeleton Loading

```tsx
// Row-by-row skeleton to match real content height
<Each of={Array.from({ length: limit })}>
  {(_, i) => (
    <TableRow key={i}>
      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
    </TableRow>
  )}
</Each>

// Full skeleton card (two-panel layout loading state)
<div className="bg-white dark:bg-[#0f172a] rounded-3xl ... p-6">
  <div className="flex justify-between items-center mb-6 pb-6 border-b border-dashed ...">
    <Skeleton className="h-8 w-48" />
    <div className="flex items-center gap-3">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-10 w-40 rounded-xl" />
    </div>
  </div>
  ...
</div>

// Header skeleton
<Skeleton className="h-8 w-48" />

// Spinner loading (inline)
<div className="flex items-center gap-2 text-muted-foreground">
  <Loader2 className="h-4 w-4 animate-spin" />
  <span className="text-sm">Memuat...</span>
</div>
```

### Empty State

```tsx
// Table row empty
<TableRow>
  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
    {t("no_data")}
  </TableCell>
</TableRow>

// Full-panel empty (two-panel layout)
<div className={`h-full min-h-[400px] flex items-center justify-center rounded-3xl border border-slate-100 dark:border-white/5 ${isDark ? "bg-slate-800/30" : "bg-slate-50"}`}>
  <Settings className={`h-12 w-12 mx-auto mb-4 ${isDark ? "text-slate-600" : "text-slate-300"}`} />
  <p className={isDark ? "text-slate-500" : "text-slate-400"}>Select an item to view details</p>
</div>

// Shared EmptyState component (with action)
<EmptyState
  icon={<FileX className="h-12 w-12" />}
  title="No data found"
  description="Try adjusting your search criteria"
  action={{ label: "Clear filters", onClick: clearFilters, variant: "outline" }}
/>
```

### DetailRow (Label + Value Grid)

```tsx
function DetailRow({ label, value, isDark, mono }: {
  label: string
  value: string | null | undefined
  isDark: boolean
  mono?: boolean
}) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{label}</span>
      <span className={`col-span-2 text-sm ${mono ? "font-mono" : ""} ${isDark ? "text-slate-200" : "text-slate-700"}`}>
        {value || '—'}
      </span>
    </div>
  )
}
```

### Delete Confirmation Dialog

```tsx
<DeleteConfirmationDialog
  open={isDeleteOpen}
  onOpenChange={setIsDeleteOpen}
  onConfirm={() => handleDelete(item)}
  itemName={item.name}
  isDeleting={isDeleting}
/>
```

### Inline Tab Navigation

```tsx
<nav className="flex gap-1">
  {tabList.map((tab) => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={`py-3 px-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
        activeTab === tab.id
          ? 'border-primary text-primary'
          : isDark
            ? 'border-transparent text-slate-400 hover:text-slate-200'
            : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
    >
      {tab.label}
    </button>
  ))}
</nav>
```

### Shared Tabs Component (Settings)

```tsx
<Tabs tabs={tabItems} defaultValue="company" />
// tabItems: Array<{ label: string; value: string; content: React.ReactNode }>
```

### Dynamic Icon (from string name)

```tsx
// menu.tsx — render lucide icon from database string
const DynamicLucideIcon = ({ name, className }: { name: string; className?: string }) => {
  const IconComponent = icons[name as keyof typeof icons] as React.ComponentType<{ className?: string }>
  return IconComponent ? <IconComponent className={className} /> : <HelpCircle className={className} />
}
```

---

## Dark Mode Color System

### Theme Access

```tsx
const isDark = useThemeStore((s) => s.isDark)
```

### Color Variables (always use ternary)

```tsx
// Text
isDark ? "text-slate-200" : "text-slate-700"    // body text
isDark ? "text-slate-400" : "text-slate-500"    // muted/label text
isDark ? "text-white" : "text-slate-800"        // headings
isDark ? "text-slate-300" : "text-slate-600"    // secondary text

// Backgrounds
isDark ? "bg-slate-800/50" : "bg-slate-50"     // card backgrounds
isDark ? "bg-slate-800/30" : "bg-slate-50"     // empty state bg
isDark ? "bg-slate-950" : "bg-white"           // input backgrounds

// Borders
isDark ? "border-slate-700" : "border-slate-200"
isDark ? "border-slate-700/50" : "border-slate-200"
isDark ? "border-white/5" : "border-slate-100"

// Primary (brand)
isDark ? "text-primary-400" : "text-primary-600"
isDark ? "bg-primary-600" : "bg-primary-600"   // same for active state

// Cards
isDark ? "bg-[#0f172a]" : "bg-white"

// Skeleton
isDark ? "bg-slate-800" : "bg-slate-200"
```

### Precomputed CSS Variables (DRY pattern)

```tsx
// In components that use dark mode heavily (laporan-dinamis pattern)
const textClass = isDark ? 'text-slate-300' : 'text-slate-600'
const mutedClass = isDark ? 'text-slate-500' : 'text-slate-400'
const headingClass = isDark ? 'text-white' : 'text-slate-800'
const cardClass = isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'
const codeClass = isDark ? 'bg-slate-950 text-slate-300' : 'bg-slate-100 text-slate-700'
```

---

## Icon Usage

### Source
All icons from `lucide-react` (named imports only — no dynamic string-to-icon lookup except `DynamicLucideIcon`).

### Common Icons by Context

| Context | Icon | Notes |
|---------|------|-------|
| Edit / Settings | `Settings`, `Pencil` | edit actions |
| Add / New | `Plus` | always first in button |
| Delete | `Trash2` | destructive actions |
| Search | `Search` | absolute-positioned in input |
| Refresh / Reload | `RefreshCw` | with `animate-spin` when loading |
| View / Detail | `Eye` | row actions |
| Download | `FileDown` | export actions |
| Database | `Database` | dataset contexts |
| Filter | `Filter` | filter contexts |
| Columns | `Columns` | column config |
| Grouping | `Group` | grouping config |
| Users / Access | `Users` | access management |
| Activity / Log | `Activity` | activity logs |
| Alert / Warning | `AlertTriangle` | warning states |
| Loading | `Loader2` | animate-spin |
| File / Report | `FileText` | reports |
| Save | `Save` | form submit |
| Chevron | `ChevronRight` | navigation |
| Menu | `Menu` | sidebar toggle |
| Empty | `FileX` | empty state |
| Auth | `ShieldAlert` | auth/security |

### Icon + Text Button

```tsx
<Button variant="outline" size="sm">
  <Settings className="mr-2 h-4 w-4" />Edit
</Button>
```

### Spin Animation on Loading

```tsx
<RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
```

---

## Data Fetching Patterns

### TanStack Query Hook Pattern

```tsx
// src/domains/*/hooks/use*.ts
const { data: response, isLoading, isFetching, refetch } = useEntityList(params)
const deleteMutation = useDeleteEntity()

// Delete with toast
deleteMutation.mutate(id, {
  onSuccess: () => toast({ title: t('messages.deleted'), variant: 'success' }),
  onError: () => toast({ title: t('messages.delete_error'), variant: 'destructive' }),
})
```

### Service Layer Pattern

```tsx
// src/domains/*/services/*Service.ts
// NEVER hardcode success: true — return raw BackendResponse
async getEntity(id: string): Promise<IAPIResponse<IEntity>> {
  const result = await getEntityFn({ data: { id } })
  return result as IAPIResponse<IEntity>
}
```

### Hook Error Handling (MANDATORY)

```tsx
const response = await entityService.getEntity(id)
if (!response.success) throw new Error(response.message || 'Failed to fetch')  // check FIRST
if (!response || !response.data) throw new Error('Invalid response format')     // then check data
const data = response.data as IEntity
```

### Infinite Scroll with IntersectionObserver

```tsx
const { data: infiniteData, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useReportsInfinite()
const observer = useRef<IntersectionObserver | null>(null)
const lastElementRef = useCallback((node: HTMLDivElement | null) => {
  if (isLoading || isFetchingNextPage) return
  if (observer.current) observer.current.disconnect()
  observer.current = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && hasNextPage) fetchNextPage()
  })
  if (node) observer.current.observe(node)
}, [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage])

// Usage
<div ref={isLast ? lastElementRef : null} key={item.id}>...</div>
```

### Manual Fetch (Simple Pages)

```tsx
const [data, setData] = useState([])
const [isLoading, setIsLoading] = useState(false)

useEffect(() => {
  setIsLoading(true)
  service.getList(params).then(res => {
    if (res.success) setData(res.data)
  }).finally(() => setIsLoading(false))
}, [params])
```

### Debounced Search

```tsx
const [search, setSearch] = useState('')
const [page, setPage] = useState(1)
const debouncedSearch = useDebounce(search, 500)

useEffect(() => {
  setPage(1)  // reset to page 1 on search change
  queryClient.invalidateQueries({ queryKey: ['entity', debouncedSearch] })
}, [debouncedSearch])
```

### Browse Search (Typeahead)

```tsx
const { options: searchResults, isLoading: searchLoading, onSearchChange } = useBrowseSearch({
  kodeBrowse: selectedType ?? '',
  minChars: 1,
  limit: 100,
})
```

---

## Form Patterns

### React Hook Form + Zod (Standard)

```tsx
const form = useForm<IFormSchema>({
  defaultValues: { field1: '', field2: '' },
})

const onSubmit = (values: IFormSchema) => {
  mutation.mutate(values)
}

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
    <FormField control={form.control} name="field1" render={({ field }) => (
      <FormItem>
        <FormLabel>Label</FormLabel>
        <FormControl><Input {...field} /></FormControl>
        <FormMessage />
      </FormItem>
    )} />
  </form>
</Form>
```

### Form with External Submit Button (CompanyForm pattern)

```tsx
<form id="company-form" onSubmit={form.handleSubmit(onSubmit)}>
  {/* fields */}
</form>
<Button type="submit" form="company-form" loading={isPending}>
  <Save className="mr-2 h-4 w-4" />Save
</Button>
```

### Form Layout: Label-Field Grid with Divider

```tsx
<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
  <div className="lg:col-span-5 space-y-4">
    <h3 className={headingClass}>Section Title</h3>
    {/* left column fields */}
  </div>
  <div className="hidden lg:block w-[1px] bg-slate-200 dark:bg-slate-800 self-stretch" />
  <div className="lg:col-span-6 space-y-4">
    {/* right column fields */}
  </div>
</div>
```

### Login Form

```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
    <FormField control={form.control} name="username" render={({ field }) => (
      <FormItem>
        <FormLabel>Username</FormLabel>
        <FormControl><Input placeholder="Username" {...field} /></FormControl>
        <FormMessage />
      </FormItem>
    )} />
    <FormField control={form.control} name="password" render={({ field }) => (
      <FormItem>
        <FormLabel>Password</FormLabel>
        <FormControl>
          <div className="relative">
            <Input type={showPassword ? 'text' : 'password'} {...field} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>
    )} />
    <Button type="submit" className="w-full" loading={isPending}>Sign In</Button>
  </form>
</Form>
```

### File Upload

```tsx
<FileUpload
  variant="dropzone"
  onChange={(url) => form.setValue('logo', url)}
  value={form.watch('logo')}
/>
```

---

## Tab Navigation Patterns

### Inline Nav Tabs (Detail Panel — laporan-dinamis style)

```tsx
const tabList = [
  { id: 'umum', label: 'Umum' },
  { id: 'filter', label: `Filter (${count})` },
  { id: 'dataset', label: `Dataset (${count})` },
  { id: 'kolom', label: 'Kolom' },
  { id: 'grouping', label: 'Grouping' },
  { id: 'akses', label: 'Akses' },
]

<nav className="flex gap-1">
  {tabList.map((tab) => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={`py-3 px-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
        activeTab === tab.id
          ? 'border-primary text-primary'
          : isDark
            ? 'border-transparent text-slate-400 hover:text-slate-200'
            : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
    >
      {tab.label}
    </button>
  ))}
</nav>
```

### Shared Tabs Component (Settings — perusahaan style)

```tsx
const tabItems = [
  { label: 'Company', value: 'company', content: <CompanyForm /> },
  { label: 'Numbering', value: 'numbering', content: <NumberingForm /> },
]
<Tabs tabs={tabItems} defaultValue="company" />
```

---

## Responsive Design

### Breakpoints Strategy

```tsx
// Flex containers always use sm:/md: breakpoints
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

// Grid: 1 col mobile, multi-col desktop
<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

// Input: full width mobile, fixed width desktop
<div className="relative w-full sm:w-64">

// Tables: always wrap in overflow-x-auto
```

### Mobile-First Toolbar

```tsx
// Toolbar: stack on mobile, row on desktop
<div className="p-4 border-b ... flex flex-col sm:flex-row sm:items-center justify-between gap-4">
  <div className="flex w-full sm:w-auto items-center gap-2">
    {/* Search bar: full width mobile */}
    <div className="relative w-full sm:w-64">...</div>
  </div>
  <div className="flex items-center gap-2">
    {/* Action buttons: right-aligned */}
  </div>
</div>
```

---

## Feature-Specific Patterns

### Login Page

- Animated gradient blob background (`animate-blob`, `animation-delay-2000`)
- Full-page skeleton while auth initializes
- SVG show/hide password toggle
- TanStack Router `beforeLoad` redirect guard
- `useAuthStore` for auth state persistence
- Bilingual labels (Indonesian)

### Kas/Bank

- `useRef` to apply `DB_PERKIRAAN` / `DB_PERIODE` default dates once
- Filter bar: search + tipe select + dateFrom + dateTo
- Dynamic auth columns computed from `maxOl` ( otorisasi level)
- TanStack Router `Link` for row navigation to detail page
- Formatter: currency IDR with `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' })`

### Menu Management

- `DynamicLucideIcon` for rendering icons from database string names
- `Badge` for menu level indicator (L0, L1, L2)
- `confirm()` dialog for delete confirmation
- Expandable/collapsible submenu rows

### Perusahaan (Settings)

- Shared `Tabs` component for Company / Numbering sections
- `Card` component (not raw div) as outer container
- 12-column grid with vertical divider
- Nested sub-tabs within right column (NPWP1 / NPWP2)
- `form.reset()` after fetch to populate defaults
- ISO date string formatting on submit
- `FileUpload` with `variant="dropzone"` for logo/signature

### Config Logs

- Two-panel with sidebar listing DB tables
- Check-all / uncheck-all for tracked fields
- Complex `<Show>` fallback chain: loading skeleton → empty → content
- `Badge` with `success`/`info`/`danger` variants for operation types

### Activity Logs

- Modal overlay for detail view (`fixed inset-0 z-50 flex items-center justify-center`)
- `colSpan` on detail rows
- Raw JSON `pre` display in monospace font
- Timestamp formatting with `toLocaleDateString('id-ID')`

### Dynamic Browse

- TanStack Query `useBrowseSearch` hook with `minChars` guard
- `staleTime: 60 * 60 * 1000` for type cache
- `GenericBrowsePicker` / `SearchableSelect` for typeahead
- Renders all fields beside key/label in result display

### Laporan Dinamis

- Infinite scroll with `IntersectionObserver`
- 6-tab inline nav panel
- `DetailRow` label/value grid in "Umum" tab
- Nested table within tab content
- Precomputed `cardClass` / `codeClass` variables
- Badge for active/inactive status with manual color override

---

## Pagination

```tsx
// usePagination hook
const { page, setPage, limit, renderPagination } = usePagination(10)

// renderPagination usage in component
<div className={`p-4 border-t ${isDark ? "border-slate-700/50" : "border-slate-200"}`}>
  {renderPagination({ totalPages, totalItems })}
</div>

// DataPagination component (shared)
<DataPagination page={page} totalPages={totalPages} onPageChange={setPage} />
```

---

## Date & Number Formatting

```tsx
// Date (Indonesian locale)
new Date(value).toLocaleDateString('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

// Number
Number(value).toLocaleString('id-ID')

// Currency
new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
}).format(Number(value))

// Number with decimals
Number(value).toLocaleString('id-ID', { minimumFractionDigits: 2 })
```

---

## Toast Feedback

```tsx
const { toast } = useToast()

// Success
toast({ title: t('messages.saved'), variant: 'success' })

// Error (from API response)
toast({ title: response.message || t('messages.error'), variant: 'destructive' })

// Delete confirmation
toast({ title: t('messages.deleted'), variant: 'success' })
```

---

## i18n

```tsx
const { t } = useTranslation(['domain', 'common'])

<p>{t('field.label')}</p>
<Button>{t('action.save')}</Button>

// NEVER hardcode user-facing strings
// Update BOTH locale files together:
// - src/domains/<name>/locales/en/
// - src/domains/<name>/locales/id/
```

---

## Server Functions

All backend calls MUST go through server functions (TanStack Start `createServerFn`):

```tsx
// ✅ CORRECT
import { reportService } from '@/domains/reports/services/reportService'
const { data } = useQuery({
  queryKey: ['reports'],
  queryFn: () => reportService.listReports(),
})

// ❌ WRONG (CORS issues, bypasses session)
const resp = await fetch('/api/admin/reports')
```

Service layer: `src/domains/*/services/*.ts` → `src/server/functions/*/`

---

## Mandatory Checklist

- [ ] Use `<Each />` and `<Show />` from `src/components/ui/layout/Render.tsx` — NO raw `.map()`, `&&`, or ternary in TSX
- [ ] All cards use the exact card CSS class pattern (not custom variations)
- [ ] Dark mode: use `isDark` ternary for every color class
- [ ] Icons: `lucide-react` named imports only
- [ ] Forms: React Hook Form + Zod + `<Form>` component
- [ ] No raw `fetch` in components — use service layer via TanStack Query hooks
- [ ] All errors go through `src/utils/errorMapper.ts`
- [ ] All user-facing strings via `useTranslation()` — update `en` AND `id` together
- [ ] Skeleton loading for every data-fetching UI
- [ ] Submit buttons: `loading={isPending}` prop
- [ ] NProgress top bar for API operations
- [ ] Zustand stores: `skipHydration: true` + `store.persist.rehydrate()` in `useEffect`
- [ ] No `any` type — use `unknown` and narrow
- [ ] `font-mono text-sm` for codes, IDs, field names
