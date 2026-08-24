'use client';

import {
  Users,
  Plus,
  MoreHorizontal,
  Edit2,
  CheckCircle,
  XCircle,
  Eye,
  Shield,
  GraduationCap,
  UserCheck,
  Mail,
  Calendar,
  Clock,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import * as React from 'react';

import { ConfirmationDialog, toast } from '@/components/feedback';
import { Label } from '@/components/forms';
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  SearchInput,
} from '@/components/ui';
import { useAuthStore } from '@/features/auth/store';
import { getUserFriendlyErrorMessage, parseFieldErrors } from '@/lib/errors';
import { isValidUuid } from '@/lib/user-identifier';

import { useAdminStore } from '../store';
import type {
  UserCompact,
  UserDetail,
  UpdateUserPayload,
} from '../types';

export function UserManagement() {
  const authUser = useAuthStore((state) => state.user);

  const {
    users,
    isLoadingUsers,
    usersError,
    departments,
    userSearchQuery,
    userRoleFilter,
    fetchUsers,
    fetchUserById,
    fetchDepartments,
    addUser,
    updateUser,
    deleteUser,
    setUserSearchQuery,
    setUserRoleFilter,
  } = useAdminStore();

  // Local Search Input with Debounce
  const [searchInput, setSearchInput] = React.useState(userSearchQuery);
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<UserCompact | null>(null);
  const [viewingUserId, setViewingUserId] = React.useState<string | null>(null);
  const [viewingUserDetail, setViewingUserDetail] = React.useState<UserDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = React.useState(false);
  const [deactivatingUser, setDeactivatingUser] = React.useState<UserCompact | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Add User Form State
  const [addFormData, setAddFormData] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'STUDENT' as 'STUDENT' | 'LECTURER' | 'ADMIN',
    studentIdentifier: '',
    facultyIdentifier: '',
    departmentId: '',
    nationalId: '',
  });

  // Edit User Form State
  const [editFormData, setEditFormData] = React.useState({
    firstName: '',
    lastName: '',
    nationalId: '',
    role: 'STUDENT' as 'STUDENT' | 'LECTURER' | 'ADMIN',
    isActive: true,
    isStaff: false,
  });

  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  // Initial load
  React.useEffect(() => {
    fetchUsers({ search: userSearchQuery, role: userRoleFilter });
    fetchDepartments();
  }, [fetchUsers, fetchDepartments, userSearchQuery, userRoleFilter]);

  // Handle Debounced Search
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setUserSearchQuery(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchUsers({ search: value, role: userRoleFilter });
    }, 350);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setUserSearchQuery('');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    fetchUsers({ search: '', role: userRoleFilter });
  };

  // Handle Role Filter Change
  const handleRoleFilterChange = (role: string) => {
    setUserRoleFilter(role);
    fetchUsers({ search: searchInput, role });
  };

  // Handle Open Add Modal
  const handleOpenAddModal = () => {
    setFieldErrors({});
    setAddFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'STUDENT',
      studentIdentifier: '',
      facultyIdentifier: '',
      departmentId: '',
      nationalId: '',
    });
    setIsAddModalOpen(true);
  };

  // Handle Open Edit Modal
  const handleOpenEditModal = async (user: UserCompact) => {
    setFieldErrors({});
    setEditingUser(user);
    setEditFormData({
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      nationalId: '',
      role: user.role,
      isActive: user.is_active,
      isStaff: user.role === 'ADMIN',
    });

    // Fetch full details to populate national_id and is_staff if available
    try {
      const detail = await fetchUserById(user.id);
      setEditFormData({
        firstName: detail.first_name || '',
        lastName: detail.last_name || '',
        nationalId: detail.national_id_fan || '',
        role: detail.role,
        isActive: detail.is_active,
        isStaff: detail.is_staff,
      });
    } catch {
      // Keep compact data fallback
    }
  };

  // Handle View Details Modal
  const handleOpenViewModal = async (user: UserCompact) => {
    setViewingUserId(user.id);
    setViewingUserDetail(null);
    setIsLoadingDetail(true);

    try {
      const detail = await fetchUserById(user.id);
      setViewingUserDetail(detail);
    } catch (err: unknown) {
      toast.error(getUserFriendlyErrorMessage(err));
      setViewingUserId(null);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Validate Add Form
  const validateAddForm = () => {
    const errors: Record<string, string> = {};

    const trimmedEmail = addFormData.email.trim();
    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else if (trimmedEmail.length > 254) {
      errors.email = 'Email address must not exceed 254 characters.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!addFormData.password) {
      errors.password = 'Password is required.';
    }

    if (addFormData.firstName.trim().length > 150) {
      errors.first_name = 'First name must not exceed 150 characters.';
    }

    if (addFormData.lastName.trim().length > 150) {
      errors.last_name = 'Last name must not exceed 150 characters.';
    }

    if (addFormData.role === 'STUDENT' && !addFormData.studentIdentifier.trim()) {
      errors.studentIdentifier = "Please enter the student's ID before creating the account.";
      errors.student_identifier = "Please enter the student's ID before creating the account.";
    }

    if (addFormData.role === 'LECTURER' && !addFormData.facultyIdentifier.trim()) {
      errors.facultyIdentifier = "Please enter the lecturer's faculty ID before creating the account.";
      errors.faculty_identifier = "Please enter the lecturer's faculty ID before creating the account.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Add User
  const handleSaveNewUser = async () => {
    if (!validateAddForm()) return;

    setIsSubmitting(true);
    try {
      const payload: {
        email: string;
        password?: string;
        first_name?: string;
        last_name?: string;
        national_id_fan?: string | null;
        role: 'STUDENT' | 'LECTURER' | 'ADMIN';
        student_identifier?: string;
        faculty_identifier?: string;
        department_id?: string | null;
      } = {
        email: addFormData.email.trim(),
        password: addFormData.password,
        first_name: addFormData.firstName.trim() || undefined,
        last_name: addFormData.lastName.trim() || undefined,
        national_id_fan: addFormData.nationalId.trim() || null,
        role: addFormData.role,
      };

      if (addFormData.role === 'STUDENT') {
        payload.student_identifier = addFormData.studentIdentifier.trim();
      } else if (addFormData.role === 'LECTURER') {
        payload.faculty_identifier = addFormData.facultyIdentifier.trim();
      }

      if (addFormData.departmentId && isValidUuid(addFormData.departmentId)) {
        payload.department_id = addFormData.departmentId;
      }

      await addUser(payload);
      toast.success('User created successfully.');
      setIsAddModalOpen(false);
      fetchUsers({ search: searchInput, role: userRoleFilter });
    } catch (error: unknown) {
      const parsedFields = parseFieldErrors(error);
      setFieldErrors(parsedFields);
      const friendlyMessage = getUserFriendlyErrorMessage(error);
      toast.error(friendlyMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit User
  const handleSaveEditUser = async () => {
    if (!editingUser) return;

    setIsSubmitting(true);
    setFieldErrors({});

    try {
      const payload: UpdateUserPayload = {
        first_name: editFormData.firstName.trim(),
        last_name: editFormData.lastName.trim(),
        national_id_fan: editFormData.nationalId.trim() || null,
        is_staff: editFormData.isStaff,
      };

      // Only include role / is_active if not editing own account
      const isSelf = authUser?.id === editingUser.id;
      if (!isSelf) {
        payload.role = editFormData.role;
        payload.is_active = editFormData.isActive;
      }

      await updateUser(editingUser.id, payload);
      toast.success('User updated successfully.');
      setEditingUser(null);
      fetchUsers({ search: searchInput, role: userRoleFilter });
    } catch (error: unknown) {
      const parsedFields = parseFieldErrors(error);
      setFieldErrors(parsedFields);
      const friendlyMessage = getUserFriendlyErrorMessage(error);
      toast.error(friendlyMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reactivate User
  const handleReactivateUser = async (user: UserCompact) => {
    try {
      await updateUser(user.id, { is_active: true });
      toast.success('User activated successfully.');
      fetchUsers({ search: searchInput, role: userRoleFilter });
    } catch (error: unknown) {
      toast.error(getUserFriendlyErrorMessage(error));
    }
  };

  // Confirm Deactivate User (Soft Delete)
  const handleDeactivateConfirm = async () => {
    if (!deactivatingUser) return;

    try {
      await deleteUser(deactivatingUser.id);
      toast.success('User deactivated successfully.');
      setDeactivatingUser(null);
      fetchUsers({ search: searchInput, role: userRoleFilter });
    } catch (error: unknown) {
      toast.error(getUserFriendlyErrorMessage(error));
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
            <Users className="h-6 w-6 text-primary" /> User Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage all institutional user accounts, access roles, and account statuses.
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleOpenAddModal}>
          Add New User
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <SearchInput
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              onClear={handleClearSearch}
            />
          </div>

          <div>
            <select
              className={selectClass}
              value={userRoleFilter}
              onChange={(e) => handleRoleFilterChange(e.target.value)}
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="LECTURER">LECTURER</option>
              <option value="STUDENT">STUDENT</option>
            </select>
          </div>

          <div className="flex items-center justify-end">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => fetchUsers({ search: searchInput, role: userRoleFilter })}
              disabled={isLoadingUsers}
            >
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Error State Banner */}
      {usersError && (
        <Card className="p-4 border-destructive/40 bg-destructive/10 flex items-center justify-between">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Unable to load users</p>
              <p className="text-xs text-destructive/80">We couldn't retrieve user accounts from the server. Please try again.</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchUsers({ search: searchInput, role: userRoleFilter })}
          >
            Retry
          </Button>
        </Card>
      )}

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Name</th>
                <th className="px-4 py-3.5">Email</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Created Date</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoadingUsers ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading users...
                    </div>
                  </td>
                </tr>
              ) : !usersError && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="mx-auto flex max-w-md flex-col items-center justify-center text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                        <Users className="h-6 w-6" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">No users found</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        No user accounts match your current search or filter.
                      </p>
                      <Button
                        className="mt-5"
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={handleOpenAddModal}
                      >
                        Add New User
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isSelf = authUser?.id === user.id;
                  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || '—';
                  const initialFirst = user.first_name?.[0] || '';
                  const initialLast = user.last_name?.[0] || '';
                  const avatarInitials = (initialFirst + initialLast).toUpperCase() || (user.email?.[0]?.toUpperCase() ?? 'U');

                  return (
                    <tr key={user.id} className="hover:bg-accent/40 transition-colors">
                      {/* Name */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                            {avatarInitials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{fullName}</p>
                            {isSelf && (
                              <span className="inline-block text-[10px] text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3.5 text-xs text-muted-foreground font-mono truncate">
                        {user.email}
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3.5">
                        <Badge
                          variant={
                            user.role === 'ADMIN'
                              ? 'default'
                              : user.role === 'LECTURER'
                                ? 'secondary'
                                : 'outline'
                          }
                          className="gap-1 font-semibold"
                        >
                          {user.role === 'ADMIN' && <Shield className="h-3 w-3 text-accent" />}
                          {user.role === 'LECTURER' && <UserCheck className="h-3 w-3 text-primary" />}
                          {user.role === 'STUDENT' && <GraduationCap className="h-3 w-3 text-primary" />}
                          {user.role}
                        </Badge>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <Badge
                          variant={user.is_active ? 'success' : 'secondary'}
                          className="capitalize"
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>

                      {/* Created Date */}
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenViewModal(user)}>
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEditModal(user)}>
                              <Edit2 className="h-4 w-4 mr-2" /> Edit User
                            </DropdownMenuItem>
                            {user.is_active ? (
                              <DropdownMenuItem
                                disabled={isSelf}
                                className={isSelf ? 'opacity-50 cursor-not-allowed' : 'text-destructive focus:text-destructive'}
                                onClick={() => {
                                  if (!isSelf) setDeactivatingUser(user);
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                {isSelf ? 'Cannot Deactivate Self' : 'Deactivate User'}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleReactivateUser(user)}>
                                <CheckCircle className="h-4 w-4 mr-2 text-success" /> Activate User
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add New User Modal */}
      <Dialog
        open={isAddModalOpen}
        onOpenChange={(open) => {
          if (!open) setIsAddModalOpen(false);
        }}
      >
        <DialogContent size="xl" className="sm:max-w-3xl w-full">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#102A7A] dark:text-foreground font-bold">
              Add New User Account
            </DialogTitle>
            <DialogDescription>
              Create a new user account for the university. Assign a role and enter the required information.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4 py-3 max-h-[75vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="addFirstName">First Name</Label>
                <Input
                  id="addFirstName"
                  value={addFormData.firstName}
                  onChange={(e) => setAddFormData({ ...addFormData, firstName: e.target.value })}
                  placeholder="e.g. Abebe"
                  className="mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50"
                />
                {fieldErrors.first_name && <p className="text-xs text-destructive mt-1">{fieldErrors.first_name}</p>}
              </div>

              <div>
                <Label htmlFor="addLastName">Last Name</Label>
                <Input
                  id="addLastName"
                  value={addFormData.lastName}
                  onChange={(e) => setAddFormData({ ...addFormData, lastName: e.target.value })}
                  placeholder="e.g. Kebede"
                  className="mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50"
                />
                {fieldErrors.last_name && <p className="text-xs text-destructive mt-1">{fieldErrors.last_name}</p>}
              </div>

              <div>
                <Label htmlFor="addEmail" required>Email Address</Label>
                <Input
                  id="addEmail"
                  type="email"
                  value={addFormData.email}
                  onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                  placeholder="user@aastu.edu.et"
                  className="mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50"
                />
                {fieldErrors.email && <p className="text-xs text-destructive mt-1">{fieldErrors.email}</p>}
              </div>

              <div>
                <Label htmlFor="addPassword" required>Password</Label>
                <Input
                  id="addPassword"
                  type="password"
                  value={addFormData.password}
                  onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
                  placeholder="Enter temporary password"
                  className="mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50"
                />
                {fieldErrors.password && <p className="text-xs text-destructive mt-1">{fieldErrors.password}</p>}
              </div>

              <div>
                <Label htmlFor="addRole" required>Institutional Role</Label>
                <select
                  id="addRole"
                  className={`${selectClass} mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50`}
                  value={addFormData.role}
                  onChange={(e) => setAddFormData({ ...addFormData, role: e.target.value as 'STUDENT' | 'LECTURER' | 'ADMIN' })}
                >
                  <option value="STUDENT">STUDENT</option>
                  <option value="LECTURER">LECTURER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                {fieldErrors.role && <p className="text-xs text-destructive mt-1">{fieldErrors.role}</p>}
              </div>

              <div>
                <Label htmlFor="addNationalId">National ID (FAN)</Label>
                <Input
                  id="addNationalId"
                  value={addFormData.nationalId}
                  onChange={(e) => setAddFormData({ ...addFormData, nationalId: e.target.value })}
                  placeholder="e.g. FAN-12345678"
                  className="mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50"
                />
                {fieldErrors.national_id_fan && <p className="text-xs text-destructive mt-1">{fieldErrors.national_id_fan}</p>}
              </div>
            </div>

            {/* Dynamic Role-Specific Fields */}
            {addFormData.role === 'STUDENT' && (
              <div className="space-y-4 p-4 rounded-xl border border-[#102A7A]/15 bg-accent/15">
                <div>
                  <Label htmlFor="addStudentIdentifier" required>Student Identifier (ID)</Label>
                  <Input
                    id="addStudentIdentifier"
                    value={addFormData.studentIdentifier}
                    onChange={(e) => setAddFormData({ ...addFormData, studentIdentifier: e.target.value })}
                    placeholder="e.g. ETS0123/14"
                    className="mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50"
                  />
                  {fieldErrors.studentIdentifier && <p className="text-xs text-destructive mt-1">{fieldErrors.studentIdentifier}</p>}
                  {fieldErrors.student_identifier && <p className="text-xs text-destructive mt-1">{fieldErrors.student_identifier}</p>}
                </div>

                <div>
                  <Label htmlFor="addStudentDepartment">Department (Optional)</Label>
                  <select
                    id="addStudentDepartment"
                    className={`${selectClass} mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50`}
                    value={addFormData.departmentId}
                    onChange={(e) => setAddFormData({ ...addFormData, departmentId: e.target.value })}
                  >
                    <option value="">Select Department...</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                  {fieldErrors.departmentId && <p className="text-xs text-destructive mt-1">{fieldErrors.departmentId}</p>}
                  {fieldErrors.department_id && <p className="text-xs text-destructive mt-1">{fieldErrors.department_id}</p>}
                </div>
              </div>
            )}

            {addFormData.role === 'LECTURER' && (
              <div className="space-y-4 p-4 rounded-xl border border-[#102A7A]/15 bg-accent/15">
                <div>
                  <Label htmlFor="addFacultyIdentifier" required>Faculty Identifier (ID)</Label>
                  <Input
                    id="addFacultyIdentifier"
                    value={addFormData.facultyIdentifier}
                    onChange={(e) => setAddFormData({ ...addFormData, facultyIdentifier: e.target.value })}
                    placeholder="e.g. FAC-2026-01"
                    className="mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50"
                  />
                  {fieldErrors.facultyIdentifier && <p className="text-xs text-destructive mt-1">{fieldErrors.facultyIdentifier}</p>}
                  {fieldErrors.faculty_identifier && <p className="text-xs text-destructive mt-1">{fieldErrors.faculty_identifier}</p>}
                </div>

                <div>
                  <Label htmlFor="addLecturerDepartment">Department (Optional)</Label>
                  <select
                    id="addLecturerDepartment"
                    className={`${selectClass} mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50`}
                    value={addFormData.departmentId}
                    onChange={(e) => setAddFormData({ ...addFormData, departmentId: e.target.value })}
                  >
                    <option value="">Select Department...</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                  {fieldErrors.departmentId && <p className="text-xs text-destructive mt-1">{fieldErrors.departmentId}</p>}
                  {fieldErrors.department_id && <p className="text-xs text-destructive mt-1">{fieldErrors.department_id}</p>}
                </div>
              </div>
            )}
          </DialogBody>

          <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveNewUser}
              disabled={isSubmitting}
              className="bg-[#102A7A] text-white hover:bg-[#D4AF37] hover:text-[#102A7A] transition-colors font-medium px-5"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating...
                </span>
              ) : (
                'Create User'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      {editingUser && (
        <Dialog
          open={!!editingUser}
          onOpenChange={(open) => {
            if (!open) setEditingUser(null);
          }}
        >
          <DialogContent size="xl" className="sm:max-w-xl w-full">
            <DialogHeader>
              <DialogTitle className="text-xl text-[#102A7A] dark:text-foreground font-bold">
                Edit User Account
              </DialogTitle>
              <DialogDescription>
                Update profile information and account access. Allowed fields: First Name, Last Name, National ID, Role, Active Status, and Staff Access.
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-4 py-3 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editFirstName">First Name</Label>
                  <Input
                    id="editFirstName"
                    value={editFormData.firstName}
                    onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                    placeholder="e.g. Abebe"
                    className="mt-1.5"
                  />
                  {fieldErrors.first_name && <p className="text-xs text-destructive mt-1">{fieldErrors.first_name}</p>}
                </div>

                <div>
                  <Label htmlFor="editLastName">Last Name</Label>
                  <Input
                    id="editLastName"
                    value={editFormData.lastName}
                    onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                    placeholder="e.g. Kebede"
                    className="mt-1.5"
                  />
                  {fieldErrors.last_name && <p className="text-xs text-destructive mt-1">{fieldErrors.last_name}</p>}
                </div>

                <div>
                  <Label htmlFor="editNationalId">National ID (FAN)</Label>
                  <Input
                    id="editNationalId"
                    value={editFormData.nationalId}
                    onChange={(e) => setEditFormData({ ...editFormData, nationalId: e.target.value })}
                    placeholder="e.g. FAN-12345678"
                    className="mt-1.5"
                  />
                  {fieldErrors.national_id_fan && <p className="text-xs text-destructive mt-1">{fieldErrors.national_id_fan}</p>}
                </div>

                <div>
                  <Label htmlFor="editRole">Role</Label>
                  <select
                    id="editRole"
                    className={`${selectClass} mt-1.5`}
                    value={editFormData.role}
                    disabled={authUser?.id === editingUser.id}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as 'STUDENT' | 'LECTURER' | 'ADMIN' })}
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="LECTURER">LECTURER</option>
                    <option value="STUDENT">STUDENT</option>
                  </select>
                  {authUser?.id === editingUser.id && (
                    <p className="text-xs text-muted-foreground mt-1">You cannot change your own role.</p>
                  )}
                  {fieldErrors.role && <p className="text-xs text-destructive mt-1">{fieldErrors.role}</p>}
                </div>
              </div>

              <div className="pt-2 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Active Account</p>
                    <p className="text-xs text-muted-foreground">Inactive users cannot log in to the portal.</p>
                  </div>
                  <input
                    type="checkbox"
                    id="editIsActive"
                    checked={editFormData.isActive}
                    disabled={authUser?.id === editingUser.id}
                    onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-[#102A7A] focus:ring-[#102A7A]"
                  />
                </div>
                {authUser?.id === editingUser.id && (
                  <p className="text-xs text-muted-foreground">You cannot deactivate your own account.</p>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Staff Access (is_staff)</p>
                    <p className="text-xs text-muted-foreground">Grants administrative portal permissions.</p>
                  </div>
                  <input
                    type="checkbox"
                    id="editIsStaff"
                    checked={editFormData.isStaff}
                    onChange={(e) => setEditFormData({ ...editFormData, isStaff: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-[#102A7A] focus:ring-[#102A7A]"
                  />
                </div>
              </div>
            </DialogBody>

            <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setEditingUser(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEditUser}
                disabled={isSubmitting}
                className="bg-[#102A7A] text-white hover:bg-[#D4AF37] hover:text-[#102A7A] transition-colors font-medium px-5"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </span>
                ) : (
                  'Update User'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* View User Details Modal */}
      {viewingUserId && (
        <Dialog open={!!viewingUserId} onOpenChange={() => setViewingUserId(null)}>
          <DialogContent size="3xl" className="sm:max-w-4xl w-[92vw] max-w-4xl p-0 overflow-hidden">
            <DialogHeader className="px-8 pt-7 pb-3">
              <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-foreground">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                User Profile Details
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Detailed profile overview, academic standing, and account metadata.
              </DialogDescription>
            </DialogHeader>

            {isLoadingDetail ? (
              <div className="py-20 text-center text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-3">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Loading user details...
                </div>
              </div>
            ) : viewingUserDetail ? (
              <DialogBody className="space-y-6 px-8 py-5 max-h-[80vh] overflow-y-auto">
                {/* Hero profile card */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-5 rounded-2xl border border-border bg-muted/30 p-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#102A7A] text-white font-bold text-2xl uppercase shadow-sm shrink-0">
                    {(viewingUserDetail.first_name?.[0] || '') + (viewingUserDetail.last_name?.[0] || '') || (viewingUserDetail.email?.[0] || 'U')}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <h3 className="text-xl font-bold text-foreground truncate">
                      {`${viewingUserDetail.first_name || ''} ${viewingUserDetail.last_name || ''}`.trim() || '—'}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 font-mono truncate">
                      <Mail className="h-4 w-4 shrink-0 text-primary" /> {viewingUserDetail.email}
                    </p>
                    <div className="pt-1 flex items-center gap-2.5 flex-wrap">
                      <Badge
                        variant={
                          viewingUserDetail.role === 'ADMIN'
                            ? 'default'
                            : viewingUserDetail.role === 'LECTURER'
                              ? 'secondary'
                              : 'outline'
                        }
                        className="font-semibold gap-1.5 px-3 py-1 text-xs"
                      >
                        {viewingUserDetail.role === 'ADMIN' && <Shield className="h-3.5 w-3.5 text-accent" />}
                        {viewingUserDetail.role === 'LECTURER' && <UserCheck className="h-3.5 w-3.5 text-primary" />}
                        {viewingUserDetail.role === 'STUDENT' && <GraduationCap className="h-3.5 w-3.5 text-primary" />}
                        {viewingUserDetail.role}
                      </Badge>
                      <Badge variant={viewingUserDetail.is_active ? 'success' : 'secondary'} className="px-3 py-1 text-xs">
                        {viewingUserDetail.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {viewingUserDetail.is_staff && (
                        <Badge variant="outline" className="border-primary/40 text-primary bg-primary/5 px-3 py-1 text-xs">
                          Staff Access
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Account & System Metadata Grid */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Account Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1.5 shadow-xs">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Shield className="h-4 w-4 text-primary" /> User ID
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(viewingUserDetail.id);
                            toast.success('User ID copied to clipboard');
                          }}
                          className="hover:text-primary transition-colors p-1 rounded hover:bg-accent/40"
                          title="Copy User ID"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="font-mono text-xs font-semibold text-foreground break-all select-all pt-0.5">
                        {viewingUserDetail.id}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1.5 shadow-xs">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Shield className="h-4 w-4 text-primary" /> National ID (FAN)
                      </div>
                      <p className="font-mono text-xs font-semibold text-foreground pt-0.5">
                        {viewingUserDetail.national_id_fan || 'Not provided'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1.5 shadow-xs">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Calendar className="h-4 w-4 text-primary" /> Created Date
                      </div>
                      <p className="text-xs font-semibold text-foreground pt-0.5">
                        {viewingUserDetail.created_at
                          ? new Date(viewingUserDetail.created_at).toLocaleString()
                          : '—'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1.5 shadow-xs">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Clock className="h-4 w-4 text-primary" /> Last Updated
                      </div>
                      <p className="text-xs font-semibold text-foreground pt-0.5">
                        {viewingUserDetail.updated_at
                          ? new Date(viewingUserDetail.updated_at).toLocaleString()
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Student Profile Info */}
                {viewingUserDetail.role === 'STUDENT' && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Academic Details
                    </h4>
                    <div className="p-5 rounded-2xl border border-primary/25 bg-primary/5 space-y-4">
                      <div className="flex items-center gap-2.5 text-base font-bold text-foreground">
                        <GraduationCap className="h-5 w-5 text-primary" /> Student Academic Profile
                      </div>
                      {viewingUserDetail.student_profile ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                          <div className="p-3.5 rounded-xl border border-border/60 bg-card space-y-1 shadow-xs">
                            <span className="text-xs font-medium text-muted-foreground block">Student ID</span>
                            <span className="font-mono text-sm font-bold text-foreground block">
                              {viewingUserDetail.student_profile.student_identifier || 'Not set'}
                            </span>
                          </div>
                          <div className="p-3.5 rounded-xl border border-border/60 bg-card space-y-1 shadow-xs">
                            <span className="text-xs font-medium text-muted-foreground block">Class Standing</span>
                            <span className="text-sm font-bold text-foreground block">
                              {viewingUserDetail.student_profile.class_standing || 'Not set'}
                            </span>
                          </div>
                          <div className="p-3.5 rounded-xl border border-border/60 bg-card space-y-1 shadow-xs">
                            <span className="text-xs font-medium text-muted-foreground block">Department</span>
                            <span className="text-sm font-semibold text-foreground block truncate" title={viewingUserDetail.student_profile.department_detail?.name || 'Not assigned'}>
                              {viewingUserDetail.student_profile.department_detail?.name || 'Not assigned'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No student profile record associated.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Lecturer Profile Info */}
                {viewingUserDetail.role === 'LECTURER' && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Faculty Details
                    </h4>
                    <div className="p-5 rounded-2xl border border-primary/25 bg-primary/5 space-y-4">
                      <div className="flex items-center gap-2.5 text-base font-bold text-foreground">
                        <UserCheck className="h-5 w-5 text-primary" /> Lecturer Faculty Profile
                      </div>
                      {viewingUserDetail.lecturer_profile ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                          <div className="p-3.5 rounded-xl border border-border/60 bg-card space-y-1 shadow-xs">
                            <span className="text-xs font-medium text-muted-foreground block">Faculty ID</span>
                            <span className="font-mono text-sm font-bold text-foreground block">
                              {viewingUserDetail.lecturer_profile.faculty_identifier || 'Not set'}
                            </span>
                          </div>
                          <div className="p-3.5 rounded-xl border border-border/60 bg-card space-y-1 shadow-xs">
                            <span className="text-xs font-medium text-muted-foreground block">Department</span>
                            <span className="text-sm font-semibold text-foreground block truncate" title={viewingUserDetail.lecturer_profile.department_detail?.name || 'Not assigned'}>
                              {viewingUserDetail.lecturer_profile.department_detail?.name || 'Not assigned'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No lecturer profile record associated.</p>
                      )}
                    </div>
                  </div>
                )}
              </DialogBody>
            ) : null}

            <DialogFooter className="px-8 py-4 border-t border-border bg-muted/20 flex justify-end">
              <Button
                onClick={() => setViewingUserId(null)}
                className="bg-[#102A7A] text-white hover:bg-[#D4AF37] hover:text-[#102A7A] transition-colors font-semibold px-7"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Deactivate User Confirmation Dialog (Soft Delete) */}
      {deactivatingUser && (
        <ConfirmationDialog
          open={!!deactivatingUser}
          onOpenChange={(open) => {
            if (!open) setDeactivatingUser(null);
          }}
          title="Deactivate User"
          description="Are you sure you want to deactivate this user? They will no longer be active in the system."
          confirmLabel="Deactivate User"
          destructive
          onConfirm={handleDeactivateConfirm}
          onCancel={() => setDeactivatingUser(null)}
        />
      )}
    </div>
  );
}
