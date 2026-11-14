import React, { useState } from 'react';
import { ArrowLeft, MapPin, DollarSign, CheckCircle2, Phone } from 'lucide-react';
import { JobListing } from '../types';

interface JobsViewProps {
  onBackToHome: () => void;
  jobs?: JobListing[];
  onApplyJob?: (app: any) => void;
}

export const JobsView: React.FC<JobsViewProps> = ({ onBackToHome, jobs = [], onApplyJob }) => {
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [applicantName, setApplicantName] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantNotes, setApplicantNotes] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);

  const visibleJobs = jobs.filter((j) => j.status === 'approved');

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedJob) {
      setAppliedJobs([...appliedJobs, selectedJob.id]);
      setShowApplyModal(false);

      if (onApplyJob) {
        onApplyJob({
          id: `app-${Date.now()}`,
          jobId: selectedJob.id,
          ...(selectedJob.employerId ? { employerId: selectedJob.employerId } : {}),
          jobTitle: selectedJob.title,
          companyName: selectedJob.company || 'Local Employer',
          applicantName,
          applicantPhone,
          applicantNotes,
          status: 'pending',
          appliedDate: 'Just Now'
        });
      }

      alert(`Application submitted successfully for "${selectedJob.title}".`);
    }
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-4 sticky top-14 z-20 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToHome}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Local Jobs in Kalchini & Dooars
            </h2>
            <p className="text-xs text-emerald-700 font-medium">Delivery Riders, Drivers, Stores & Tea Estate Openings</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {visibleJobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-xs text-gray-500">
            No approved job listings available right now. Check back soon.
          </div>
        ) : (
          visibleJobs.map((job) => {
            const isApplied = appliedJobs.includes(job.id);
            const canShowPublicPhone = job.publishContact === true && Boolean(job.publicContactNumber);

            return (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs hover:shadow-sm transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mb-1">
                      {job.jobType}
                    </span>
                    <h3 className="text-sm font-bold text-gray-900 leading-snug">
                      {job.title}
                    </h3>
                    <p className="text-xs text-gray-600 font-medium">{job.company || 'Local Employer'}</p>
                  </div>

                  <span className="text-[10px] text-gray-400 font-medium">
                    {job.posted || 'Active'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1 font-bold text-[#0E7438]">
                    <DollarSign className="w-3.5 h-3.5" />
                    {job.salary}
                  </span>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed bg-gray-50/70 p-2.5 rounded-xl">
                  {job.description}
                </p>

                <div className="flex items-center justify-between pt-1">
                  {canShowPublicPhone ? (
                    <a
                      href={`tel:${job.publicContactNumber}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-emerald-700"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Recruiter</span>
                    </a>
                  ) : (
                    <span className="text-[11px] text-gray-500 font-medium">
                      Apply in-app (Recruiter contact private)
                    </span>
                  )}

                  {isApplied ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Applied
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedJob(job);
                        setShowApplyModal(true);
                      }}
                      className="bg-[#0E7438] hover:bg-emerald-800 text-white font-bold text-xs py-1.5 px-3.5 rounded-xl shadow-xs active:scale-95 transition-all"
                    >
                      Apply Now
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Apply Modal */}
      {showApplyModal && selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Quick Apply: {selectedJob.title}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">{selectedJob.company || 'Local Employer'} • {selectedJob.location}</p>
            </div>

            <form onSubmit={handleApply} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-1">Experience / Notes</label>
                <textarea
                  value={applicantNotes}
                  onChange={(e) => setApplicantNotes(e.target.value)}
                  placeholder="e.g. Have 2-wheeler and local Kalchini driving license"
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-medium"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="w-1/2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-[#0E7438] hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
