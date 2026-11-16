import React, { useState } from 'react';
import { 
  Briefcase, 
  Plus, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  Users, 
  AlertCircle, 
  ArrowLeft,
  Building,
  UserCheck,
  LogOut
} from 'lucide-react';
import { JobListing, JobApplication, JobCategoryType } from '../../types';

interface EmployerDashboardProps {
  jobListings: JobListing[];
  jobApplications: JobApplication[];
  onSwitchPortal: () => void;
  onPostJob: (job: Omit<JobListing, 'id' | 'applicantsCount' | 'status' | 'createdAt'>) => void;
  onUpdateApplicationStatus: (appId: string, status: 'pending' | 'shortlisted' | 'hired' | 'rejected') => void;
  onLogout?: () => void;
}

export const EmployerDashboard: React.FC<EmployerDashboardProps> = ({
  jobListings,
  jobApplications,
  onSwitchPortal,
  onPostJob,
  onUpdateApplicationStatus,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'listings' | 'applicants' | 'post'>('listings');
  const [showPostModal, setShowPostModal] = useState(false);

  // Form states for new job
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('Kalchini Enterprise');
  const [category, setCategory] = useState<JobCategoryType>('Shop Jobs');
  const [location, setLocation] = useState('Kalchini Bazar');
  const [salary, setSalary] = useState('₹10,000 - ₹14,000 / month');
  const [jobType, setJobType] = useState<'Full-time' | 'Part-time' | 'Urgent' | 'Flexible'>('Full-time');
  const [description, setDescription] = useState('');
  const [vacancies, setVacancies] = useState(2);
  const [employerName, setEmployerName] = useState('');
  const [employerPhone, setEmployerPhone] = useState('');
  const [publishContact, setPublishContact] = useState(false);

  const categories: JobCategoryType[] = [
    'Shop Jobs',
    'Tea Garden Jobs',
    'Hotel Jobs',
    'Driver Jobs',
    'Delivery Jobs',
    'Office Jobs',
    'Daily Labour',
    'Other Jobs'
  ];

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onPostJob({
      title,
      company,
      category,
      location,
      salary,
      jobType,
      description,
      vacancies: Number(vacancies),
      employerName: employerName.trim() || company.trim(),
      employerPhone: employerPhone.trim(),
      publishContact,
      ...(publishContact && employerPhone.trim() ? { publicContactNumber: employerPhone.trim() } : {})
    });

    setTitle('');
    setDescription('');
    setPublishContact(false);
    setShowPostModal(false);
    setActiveTab('listings');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20">
      {/* Header */}
      <div className="bg-purple-900 text-white p-4 shadow-md sticky top-0 z-30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onSwitchPortal}
              className="p-1.5 bg-purple-950/60 rounded-lg hover:bg-purple-950 transition-colors"
              title="Switch Portal"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base tracking-wide">TORSA JOBS</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-700 text-purple-100">
                  RECRUITER
                </span>
              </div>
              <p className="text-xs text-purple-200">Local Employer & Hiring Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowPostModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Post Vacancy
            </button>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Sign Out"
                className="p-1.5 bg-rose-700/80 hover:bg-rose-700 text-white rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick info banner */}
        <div className="bg-purple-950/70 backdrop-blur-xs rounded-xl p-3 flex items-center justify-between border border-purple-800">
          <div>
            <p className="font-bold text-sm text-white">{company}</p>
            <p className="text-xs text-purple-300">Dooars Employment Partner • Kalchini</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-purple-300 block">Active Listings</span>
            <span className="font-black text-white text-base">{jobListings.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 flex justify-between">
        <button
          onClick={() => setActiveTab('listings')}
          className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'listings'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          My Vacancies ({jobListings.length})
        </button>

        <button
          onClick={() => setActiveTab('applicants')}
          className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'applicants'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Applicants ({jobApplications.length})
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 flex-1">
        {/* TAB 1: JOB LISTINGS */}
        {activeTab === 'listings' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-sm">Posted Openings</h3>
              <button
                onClick={() => setShowPostModal(true)}
                className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> New Job
              </button>
            </div>

            {jobListings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-gray-800 text-sm">No Jobs Posted Yet</h4>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  Looking for shop staff, delivery drivers, tea estate workers, or office assistants? Post a vacancy to hire local talent.
                </p>
                <button
                  onClick={() => setShowPostModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-purple-700 transition-colors"
                >
                  Post Your First Job
                </button>
              </div>
            ) : (
              jobListings.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                          {job.jobType}
                        </span>
                        <span className="text-[10px] font-semibold text-gray-500">
                          {job.category}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-gray-900">{job.title}</h4>
                      <p className="text-xs text-gray-600">{job.company || 'Direct Employer'}</p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        job.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : job.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {job.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {job.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 pt-1">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-bold text-gray-800">{job.salary}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span>{job.location}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      Open Positions: <strong>{job.vacancies}</strong>
                    </span>
                    <button
                      onClick={() => setActiveTab('applicants')}
                      className="text-purple-700 font-bold hover:underline"
                    >
                      View Applicants ({job.applicantsCount || 0}) →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: APPLICANTS */}
        {activeTab === 'applicants' && (
          <div className="space-y-3">
            <h3 className="font-bold text-gray-800 text-sm">Job Applications</h3>
            {jobApplications.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-gray-800 text-sm">No Applicants Yet</h4>
                <p className="text-xs text-gray-500">
                  Applications submitted by local job seekers in Kalchini will appear here for shortlisting or hiring.
                </p>
              </div>
            ) : (
              jobApplications.map((app) => (
                <div
                  key={app.id}
                  className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{app.applicantName}</h4>
                      <p className="text-xs text-purple-700 font-medium">Applied for: {app.jobTitle}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        app.status === 'hired'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'shortlisted'
                          ? 'bg-blue-100 text-blue-800'
                          : app.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>

                  {app.applicantNotes && (
                    <div className="bg-slate-50 p-2.5 rounded-xl text-xs text-gray-700">
                      <span className="font-bold text-gray-500 block text-[10px] uppercase">Notes / Experience:</span>
                      {app.applicantNotes}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-mono text-gray-600">{app.applicantPhone}</span>
                    <a
                      href={`tel:${app.applicantPhone}`}
                      className="px-3 py-1 bg-purple-600 text-white font-bold rounded-lg flex items-center gap-1 shadow-sm"
                    >
                      <Phone className="w-3 h-3" /> Call Candidate
                    </a>
                  </div>

                  <div className="pt-2 border-t border-gray-100 grid grid-cols-3 gap-2">
                    <button
                      onClick={() => onUpdateApplicationStatus(app.id, 'shortlisted')}
                      className="py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs"
                    >
                      Shortlist
                    </button>
                    <button
                      onClick={() => onUpdateApplicationStatus(app.id, 'hired')}
                      className="py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs"
                    >
                      Hire
                    </button>
                    <button
                      onClick={() => onUpdateApplicationStatus(app.id, 'rejected')}
                      className="py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg text-xs"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Post Vacancy Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-base text-gray-900">Post New Local Job Vacancy</h3>
            <form onSubmit={handleCreateJob} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Job Designation / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shop Sales Associate"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Company / Store Name</label>
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Job Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as JobCategoryType)}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Job Type</label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Vacancies</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={vacancies}
                    onChange={(e) => setVacancies(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Salary Range / Pay</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ₹9,000 - ₹12,000 / month"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Work Location</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Job Description & Requirements</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe daily responsibilities, working hours, and candidate qualifications..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Recruiter Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Contact person"
                    value={employerName}
                    onChange={(e) => setEmployerName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Recruiter Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="98320..."
                    value={employerPhone}
                    onChange={(e) => setEmployerPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-[11px] text-gray-700 bg-slate-50 p-2 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={publishContact}
                  onChange={(e) => setPublishContact(e.target.checked)}
                  className="rounded text-purple-600"
                />
                <span>Opt in to show recruiter phone publicly on job card</span>
              </label>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 text-white font-bold rounded-xl shadow-sm hover:bg-purple-700"
                >
                  Submit Vacancy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
