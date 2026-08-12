'use client';

import {
  Building,
  GraduationCap,
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Layers,
} from 'lucide-react';
import * as React from 'react';

import { toast } from '@/components/feedback';
import { Label } from '@/components/forms';
import {
  Button,
  Card,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormSelect,
  Input,
  SearchInput,
} from '@/components/ui';

import { adminService } from '../services/admin-service';
import { COLLEGES, getDepartmentsByCollege } from '@/constants';
import type {
  College,
  Program,
  AcademicYearItem,
  SemesterItem,
  Department,
} from '../types';

export function AcademicStructureManagement() {
  const [activeTab, setActiveTab] = React.useState<'colleges' | 'programs' | 'years' | 'semesters'>('colleges');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  // Data states
  const [colleges, setColleges] = React.useState<College[]>([]);
  const [programs, setPrograms] = React.useState<Program[]>([]);
  const [academicYears, setAcademicYears] = React.useState<AcademicYearItem[]>([]);
  const [semesters, setSemesters] = React.useState<SemesterItem[]>([]);
  const [departments, setDepartments] = React.useState<Department[]>([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<any | null>(null);
  const [deletingItem, setDeletingItem] = React.useState<{ type: string; id: string; name: string } | null>(null);

  // Form states
  const [collegeForm, setCollegeForm] = React.useState({ name: '', code: '' });
  const [programForm, setProgramForm] = React.useState({ college: 'College of Engineering', department: '', name: '', code: '', degreeLevel: 'B.Sc.', totalCreditHoursRequired: 120 });
  const [yearForm, setYearForm] = React.useState({ displayLabel: '', startBoundary: '', endBoundary: '' });
  const [semesterForm, setSemesterForm] = React.useState({ academicYear: '', semesterIndex: 1 });

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [cols, progs, years, sems, depts] = await Promise.all([
        adminService.getColleges(),
        adminService.getPrograms(),
        adminService.getAcademicYears(),
        adminService.getSemesters(),
        adminService.getDepartments(),
      ]);
      setColleges(cols);
      setPrograms(progs);
      setAcademicYears(years);
      setSemesters(sems);
      setDepartments(depts);
    } catch {
      toast.error('Failed to load academic structure data');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setCollegeForm({ name: '', code: '' });
    setProgramForm({ college: 'College of Engineering', department: departments[0]?.id || '', name: '', code: '', degreeLevel: 'B.Sc.', totalCreditHoursRequired: 120 });
    setYearForm({ displayLabel: '2026/2027', startBoundary: '2026-09-01', endBoundary: '2027-06-30' });
    setSemesterForm({ academicYear: academicYears[0]?.id || '', semesterIndex: 1 });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (activeTab === 'colleges') {
        if (!collegeForm.name || !collegeForm.code) {
          toast.error('Missing fields', { description: 'Name and Code are required.' });
          return;
        }
        if (editingItem) {
          await adminService.updateCollege(editingItem.id, collegeForm);
          toast.success('College updated');
        } else {
          await adminService.createCollege(collegeForm);
          toast.success('College created');
        }
      } else if (activeTab === 'programs') {
        if (!programForm.name || !programForm.code || !programForm.department) {
          toast.error('Missing fields', { description: 'Name, Code, and Department are required.' });
          return;
        }
        if (editingItem) {
          await adminService.updateProgram(editingItem.id, programForm);
          toast.success('Program updated');
        } else {
          await adminService.createProgram(programForm);
          toast.success('Program created');
        }
      } else if (activeTab === 'years') {
        if (!yearForm.displayLabel || !yearForm.startBoundary || !yearForm.endBoundary) {
          toast.error('Missing fields', { description: 'All boundaries and label are required.' });
          return;
        }
        if (editingItem) {
          await adminService.updateAcademicYear(editingItem.id, yearForm);
          toast.success('Academic Year updated');
        } else {
          await adminService.createAcademicYear(yearForm);
          toast.success('Academic Year created');
        }
      } else if (activeTab === 'semesters') {
        if (!semesterForm.academicYear) {
          toast.error('Missing fields', { description: 'Academic Year is required.' });
          return;
        }
        if (editingItem) {
          await adminService.updateSemester(editingItem.id, semesterForm);
          toast.success('Semester updated');
        } else {
          await adminService.createSemester(semesterForm);
          toast.success('Semester created');
        }
      }
      setIsModalOpen(false);
      void loadData();
    } catch (err: any) {
      toast.error('Save failed', { description: err?.message || 'An error occurred while saving.' });
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      if (deletingItem.type === 'college') await adminService.deleteCollege(deletingItem.id);
      if (deletingItem.type === 'program') await adminService.deleteProgram(deletingItem.id);
      if (deletingItem.type === 'year') await adminService.deleteAcademicYear(deletingItem.id);
      if (deletingItem.type === 'semester') await adminService.deleteSemester(deletingItem.id);
      toast.success(`${deletingItem.type} deleted`);
      setDeletingItem(null);
      void loadData();
    } catch (err: any) {
      toast.error('Delete failed', { description: err?.message || 'An error occurred.' });
    }
  };

  const selectClass =
    'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" /> Academic Structure Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage institutional Colleges, Programs, Academic Years, and Semesters directly connected to DRF API.
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleOpenAddModal}>
          Add New {activeTab.slice(0, -1).toUpperCase()}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-4">
        {[
          { key: 'colleges', label: 'Colleges', icon: Building, count: colleges.length },
          { key: 'programs', label: 'Degree Programs', icon: GraduationCap, count: programs.length },
          { key: 'years', label: 'Academic Years', icon: Calendar, count: academicYears.length },
          { key: 'semesters', label: 'Semesters', icon: Clock, count: semesters.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as any);
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-muted font-normal">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <Card className="p-4">
        <SearchInput
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
        />
      </Card>

      {/* Table Content */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === 'colleges' && (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase">
                  <tr>
                    <th className="px-4 py-3.5">Code</th>
                    <th className="px-4 py-3.5">College Name</th>
                    <th className="px-4 py-3.5">Created At</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {colleges
                    .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.code.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((col) => (
                      <tr key={col.id} className="hover:bg-accent/40">
                        <td className="px-4 py-3.5 font-mono font-bold text-primary">{col.code}</td>
                        <td className="px-4 py-3.5 font-semibold text-foreground">{col.name}</td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">{col.createdAt}</td>
                        <td className="px-4 py-3.5 text-right space-x-2">
                          <Button size="xs" variant="ghost" onClick={() => { setEditingItem(col); setCollegeForm({ name: col.name, code: col.code }); setIsModalOpen(true); }}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="xs" variant="ghost" className="text-destructive" onClick={() => setDeletingItem({ type: 'college', id: col.id, name: col.name })}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {activeTab === 'programs' && (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase">
                  <tr>
                    <th className="px-4 py-3.5">Code</th>
                    <th className="px-4 py-3.5">Program Name</th>
                    <th className="px-4 py-3.5">Degree Level</th>
                    <th className="px-4 py-3.5">Credits Required</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {programs
                    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.code.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((prg) => (
                      <tr key={prg.id} className="hover:bg-accent/40">
                        <td className="px-4 py-3.5 font-mono font-bold text-primary">{prg.code}</td>
                        <td className="px-4 py-3.5 font-semibold text-foreground">{prg.name}</td>
                        <td className="px-4 py-3.5 text-xs">{prg.degreeLevel}</td>
                        <td className="px-4 py-3.5 text-xs">{prg.totalCreditHoursRequired} hrs</td>
                        <td className="px-4 py-3.5 text-right space-x-2">
                          <Button size="xs" variant="ghost" onClick={() => { setEditingItem(prg); setProgramForm({ college: 'College of Engineering', department: prg.department, name: prg.name, code: prg.code, degreeLevel: prg.degreeLevel, totalCreditHoursRequired: prg.totalCreditHoursRequired }); setIsModalOpen(true); }}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="xs" variant="ghost" className="text-destructive" onClick={() => setDeletingItem({ type: 'program', id: prg.id, name: prg.name })}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {activeTab === 'years' && (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase">
                  <tr>
                    <th className="px-4 py-3.5">Academic Year</th>
                    <th className="px-4 py-3.5">Start Date</th>
                    <th className="px-4 py-3.5">End Date</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {academicYears
                    .filter((y) => y.displayLabel.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((yr) => (
                      <tr key={yr.id} className="hover:bg-accent/40">
                        <td className="px-4 py-3.5 font-semibold text-foreground">{yr.displayLabel}</td>
                        <td className="px-4 py-3.5 text-xs">{yr.startBoundary}</td>
                        <td className="px-4 py-3.5 text-xs">{yr.endBoundary}</td>
                        <td className="px-4 py-3.5 text-right space-x-2">
                          <Button size="xs" variant="ghost" onClick={() => { setEditingItem(yr); setYearForm({ displayLabel: yr.displayLabel, startBoundary: yr.startBoundary, endBoundary: yr.endBoundary }); setIsModalOpen(true); }}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="xs" variant="ghost" className="text-destructive" onClick={() => setDeletingItem({ type: 'year', id: yr.id, name: yr.displayLabel })}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {activeTab === 'semesters' && (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase">
                  <tr>
                    <th className="px-4 py-3.5">Semester Index</th>
                    <th className="px-4 py-3.5">Academic Year</th>
                    <th className="px-4 py-3.5">Created At</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {semesters.map((sem) => (
                    <tr key={sem.id} className="hover:bg-accent/40">
                      <td className="px-4 py-3.5 font-bold text-foreground">Semester {sem.semesterIndex}</td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">{sem.academicYearLabel}</td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">{sem.createdAt}</td>
                      <td className="px-4 py-3.5 text-right space-x-2">
                        <Button size="xs" variant="ghost" onClick={() => { setEditingItem(sem); setSemesterForm({ academicYear: sem.academicYear, semesterIndex: sem.semesterIndex }); setIsModalOpen(true); }}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="xs" variant="ghost" className="text-destructive" onClick={() => setDeletingItem({ type: 'semester', id: sem.id, name: `Semester ${sem.semesterIndex}` })}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </Card>

      {/* Dynamic Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? `Edit ${activeTab.slice(0, -1)}` : `Add New ${activeTab.slice(0, -1)}`}
            </DialogTitle>
            <DialogDescription>
              Specify the parameters matching the backend API serializer contract.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4 py-2">
            {activeTab === 'colleges' && (
              <>
                <div>
                  <Label htmlFor="colName">College Name *</Label>
                  <Input id="colName" value={collegeForm.name} onChange={(e) => setCollegeForm({ ...collegeForm, name: e.target.value })} placeholder="e.g. College of Applied Sciences" />
                </div>
                <div>
                  <Label htmlFor="colCode">College Code *</Label>
                  <Input id="colCode" value={collegeForm.code} onChange={(e) => setCollegeForm({ ...collegeForm, code: e.target.value })} placeholder="e.g. CAS" />
                </div>
              </>
            )}

            {activeTab === 'programs' && (
              <>
                <div>
                  <Label htmlFor="prgCollege">College *</Label>
                  <FormSelect
                    id="prgCollege"
                    value={programForm.college}
                    onChange={(e) => {
                      const newCol = e.target.value;
                      const depts = getDepartmentsByCollege(newCol);
                      setProgramForm({
                        ...programForm,
                        college: newCol,
                        department: depts[0]?.id || '',
                      });
                    }}
                  >
                    {COLLEGES.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </FormSelect>
                </div>
                <div>
                  <Label htmlFor="prgDept">Department *</Label>
                  <FormSelect id="prgDept" value={programForm.department} onChange={(e) => setProgramForm({ ...programForm, department: e.target.value })}>
                    {getDepartmentsByCollege(programForm.college).map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </FormSelect>
                </div>
                <div>
                  <Label htmlFor="prgName">Program Name *</Label>
                  <Input id="prgName" value={programForm.name} onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })} placeholder="e.g. Software Engineering" />
                </div>
                <div>
                  <Label htmlFor="prgCode">Program Code *</Label>
                  <Input id="prgCode" value={programForm.code} onChange={(e) => setProgramForm({ ...programForm, code: e.target.value })} placeholder="e.g. SE" />
                </div>
                <div>
                  <Label htmlFor="prgDegree">Degree Level</Label>
                  <Input id="prgDegree" value={programForm.degreeLevel} onChange={(e) => setProgramForm({ ...programForm, degreeLevel: e.target.value })} placeholder="B.Sc." />
                </div>
                <div>
                  <Label htmlFor="prgCredits">Credit Hours Required</Label>
                  <Input id="prgCredits" type="number" value={programForm.totalCreditHoursRequired} onChange={(e) => setProgramForm({ ...programForm, totalCreditHoursRequired: Number(e.target.value) })} />
                </div>
              </>
            )}

            {activeTab === 'years' && (
              <>
                <div>
                  <Label htmlFor="yrLabel">Display Label *</Label>
                  <Input id="yrLabel" value={yearForm.displayLabel} onChange={(e) => setYearForm({ ...yearForm, displayLabel: e.target.value })} placeholder="e.g. 2026/2027" />
                </div>
                <div>
                  <Label htmlFor="yrStart">Start Date *</Label>
                  <Input id="yrStart" type="date" value={yearForm.startBoundary} onChange={(e) => setYearForm({ ...yearForm, startBoundary: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="yrEnd">End Date *</Label>
                  <Input id="yrEnd" type="date" value={yearForm.endBoundary} onChange={(e) => setYearForm({ ...yearForm, endBoundary: e.target.value })} />
                </div>
              </>
            )}

            {activeTab === 'semesters' && (
              <>
                <div>
                  <Label htmlFor="semYear">Academic Year *</Label>
                  <FormSelect id="semYear" value={semesterForm.academicYear} onChange={(e) => setSemesterForm({ ...semesterForm, academicYear: e.target.value })}>
                    {academicYears.map((y) => (
                      <option key={y.id} value={y.id}>{y.displayLabel}</option>
                    ))}
                  </FormSelect>
                </div>
                <div>
                  <Label htmlFor="semIdx">Semester Index (e.g. 1 or 2)</Label>
                  <Input id="semIdx" type="number" value={semesterForm.semesterIndex} onChange={(e) => setSemesterForm({ ...semesterForm, semesterIndex: Number(e.target.value) })} />
                </div>
              </>
            )}
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deletingItem?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingItem(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
