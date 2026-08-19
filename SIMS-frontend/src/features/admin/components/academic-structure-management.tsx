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
import type {
  College,
  Program,
  AcademicYearItem,
  Semester,
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
  const [semesters, setSemesters] = React.useState<Semester[]>([]);
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
        const yearPayload = {
          display_label: yearForm.displayLabel,
          start_boundary: yearForm.startBoundary,
          end_boundary: yearForm.endBoundary,
        };
        if (editingItem) {
          await adminService.updateAcademicYear(editingItem.id, yearPayload);
          toast.success('Academic Year updated');
        } else {
          await adminService.createAcademicYear(yearPayload);
          toast.success('Academic Year created');
        }
      } else if (activeTab === 'semesters') {
        if (!semesterForm.academicYear) {
          toast.error('Missing fields', { description: 'Academic Year is required.' });
          return;
        }
        const semesterIndexParam: 'FIRST' | 'SECOND' = semesterForm.semesterIndex === 2 ? 'SECOND' : 'FIRST';
        if (editingItem) {
          await adminService.updateSemester(editingItem.id, { semester_index: semesterIndexParam });
          toast.success('Semester updated');
        } else {
          await adminService.createSemester({ academic_year: semesterForm.academicYear, semester_index: semesterIndexParam });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" /> Academic Structure Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure institutional Colleges, Academic Programs, Years, and Semesters.
          </p>
        </div>
      </div>

      {/* Tabs & Search Header */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-2 border-b sm:border-b-0 border-border pb-2 sm:pb-0 overflow-x-auto">
            <Button variant={activeTab === 'colleges' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab('colleges')}>
              Colleges ({colleges.length})
            </Button>
            <Button variant={activeTab === 'programs' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab('programs')}>
              Programs ({programs.length})
            </Button>
            <Button variant={activeTab === 'years' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab('years')}>
              Academic Years ({academicYears.length})
            </Button>
            <Button variant={activeTab === 'semesters' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab('semesters')}>
              Semesters ({semesters.length})
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-full sm:w-64">
              <SearchInput
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
              />
            </div>
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={handleOpenAddModal}>
              Add {activeTab.slice(0, -1)}
            </Button>
          </div>
        </div>
      </Card>

      {/* Table Content */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading academic structure data...</div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === 'colleges' && (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase">
                  <tr>
                    <th className="px-4 py-3.5">Code</th>
                    <th className="px-4 py-3.5">College Name</th>
                    <th className="px-4 py-3.5">University</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {colleges
                    .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.code.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((col) => (
                      <tr key={col.id} className="hover:bg-accent/40">
                        <td className="px-4 py-3.5 font-mono text-xs font-bold text-primary">{col.code}</td>
                        <td className="px-4 py-3.5 font-semibold text-foreground">{col.name}</td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">{col.university || 'AASTU'}</td>
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
                    <th className="px-4 py-3.5">Required Credits</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {programs
                    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.code.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((prg) => (
                      <tr key={prg.id} className="hover:bg-accent/40">
                        <td className="px-4 py-3.5 font-mono text-xs font-bold text-primary">{prg.code}</td>
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
                    <th className="px-4 py-3.5">Semester</th>
                    <th className="px-4 py-3.5">Academic Year</th>
                    <th className="px-4 py-3.5">Created At</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {semesters.map((sem) => {
                    const semLabel = sem.semesterIndex === 'FIRST' ? '1st Semester' : sem.semesterIndex === 'SECOND' ? '2nd Semester' : `Semester ${sem.semesterIndex}`;
                    const yearLabel = sem.academicYearDetail?.displayLabel || sem.academicYear;
                    return (
                      <tr key={sem.id} className="hover:bg-accent/40">
                        <td className="px-4 py-3.5 font-bold text-foreground">{semLabel}</td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">{yearLabel}</td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">{sem.createdAt || 'N/A'}</td>
                        <td className="px-4 py-3.5 text-right space-x-2">
                          <Button size="xs" variant="ghost" onClick={() => { setEditingItem(sem); setSemesterForm({ academicYear: sem.academicYear, semesterIndex: sem.semesterIndex === 'FIRST' ? 1 : 2 }); setIsModalOpen(true); }}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="xs" variant="ghost" className="text-destructive" onClick={() => setDeletingItem({ type: 'semester', id: sem.id, name: semLabel })}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
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
                  <Label htmlFor="prgCollege">College</Label>
                  <FormSelect
                    id="prgCollege"
                    value={programForm.college}
                    onChange={(e) => {
                      const newCol = e.target.value;
                      setProgramForm({
                        ...programForm,
                        college: newCol,
                      });
                    }}
                  >
                    <option value="">-- Select College (Optional) --</option>
                    {colleges.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name} ({col.code})
                      </option>
                    ))}
                  </FormSelect>
                </div>
                <div>
                  <Label htmlFor="prgDept">Department *</Label>
                  <FormSelect
                    id="prgDept"
                    value={programForm.department}
                    onChange={(e) => setProgramForm({ ...programForm, department: e.target.value })}
                  >
                    <option value="">-- Select Department --</option>
                    {departments
                      .filter((d) => !programForm.college || d.college === programForm.college)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
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
