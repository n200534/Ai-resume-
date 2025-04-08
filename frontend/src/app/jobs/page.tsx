"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Briefcase,
  Upload,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

const getMatchColor = (match) => {
  if (!match && match !== 0) return "text-gray-500";
  if (match >= 75) return "text-green-600";
  if (match >= 30) return "text-orange-500";
  return "text-red-500";
};

const JobCard = ({ job, onViewJob }) => {
  // Safely extract top 3 skills only
  const topSkills = Array.isArray(job.skills) ? job.skills.slice(0, 3) : [];

  // Handle salary display safely
  const formatSalary = (salary) => {
    if (!salary) return null;

    // If salary is an object with currency property, handle it
    if (typeof salary === "object" && salary.currency) {
      const currencySymbol = salary.currency === "USD" ? "$" : salary.currency;
      return `${currencySymbol}${
        salary.amount ? salary.amount.toLocaleString() : ""
      }`;
    }

    // Otherwise treat as number or string
    return `$${typeof salary === "number" ? salary.toLocaleString() : salary}`;
  };

  return (
    <Card className="w-80 h-80 shadow-md hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-[#162660]">
      <CardContent className="p-4 flex flex-col h-full">
        {/* Header section with fixed height */}
        <div className="flex flex-col mb-3 h-20">
          <h3 className="font-bold text-base text-[#162660] truncate">
            {job.title || job.position || "Untitled Position"}
          </h3>
          <p className="text-gray-700 font-medium text-sm truncate">
            {job.company ||
              (job.postedBy && job.postedBy.company) ||
              "Unknown Company"}
          </p>
          <p className="text-gray-500 text-xs">
            {job.location || "Location not specified"}
          </p>
        </div>
      </div>
      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
        {job.description}
      </p>
      {job.salary && (
        <p className="text-gray-700 text-sm font-medium mb-2">
          {/* Handle salary object or number appropriately */}
          {typeof job.salary === 'object' && job.salary.currency 
            ? `${job.salary.currency} ${parseFloat(job.salary.amount).toLocaleString()}`
            : typeof job.salary === 'number' 
              ? `$${job.salary.toLocaleString()}` 
              : job.salary}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {(job.skills || []).map((skill, idx) => (
          <span
            key={`${job.id || job._id}-skill-${idx}`}
            className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-700"
          >
            {skill}
          </span>
        ))}
      </div>
      <div className="flex justify-between items-center mt-auto">
        <span className={`font-bold text-sm ${getMatchColor(job.matchScore || job.match)}`}>
          {job.matchScore || job.match}% Match
        </span>
        <Button
          variant="default"
          size="sm"
          className="bg-[#162660] hover:bg-[#0e1a45] text-white rounded-md text-xs"
          onClick={() => onViewJob(job)}
        >
          View Job
        </Button>
      </div>
    </CardContent>
  </Card>
);

const JobsCarousel = ({ title, jobsData, onViewJob, loading, onViewAll }) => {
  const carouselRef = useRef(null);

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  return (
    <div className="mb-10 relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-[#162660]">{title}</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="w-8 h-8 rounded-full border border-gray-200"
            onClick={scrollLeft}
            disabled={loading}
          >
            <ChevronLeft size={18} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-8 h-8 rounded-full border border-gray-200"
            onClick={scrollRight}
            disabled={loading}
          >
            <ChevronRight size={18} />
          </Button>
          <Button
            variant="link"
            className="text-[#162660] font-medium"
            disabled={loading}
            onClick={onViewAll}
          >
            View All
          </Button>
        </div>
      </div>

      <div className="relative">
        {loading ? (
          <div className="py-8 text-center">
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#162660]"></div>
            </div>
            <p className="text-gray-500 mt-2">Loading jobs...</p>
          </div>
        ) : (
          <div
            ref={carouselRef}
            className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {jobsData && jobsData.length > 0 ? (
              jobsData.map((job) => (
                <JobCard
                  key={
                    job._id || `job-${Math.random().toString(36).substr(2, 9)}`
                  }
                  job={job}
                  onViewJob={onViewJob}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center w-full py-10 bg-gray-50 rounded-lg">
                <Briefcase className="h-12 w-12 text-gray-300 mb-2" />
                <p className="text-gray-500">No jobs found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default function JobsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [allJobs, setAllJobs] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendedLoading, setRecommendedLoading] = useState(true);
  const [filters, setFilters] = useState({
    skills: [],
    location: "",
    experience: null,
    type: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [resumeNotFound, setResumeNotFound] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

  useEffect(() => {
    // Check authentication status
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    setIsAuthenticated(!!token);

    // Fetch jobs when component mounts
    fetchJobs();

    // Only fetch recommended jobs if authenticated
    if (token) {
      fetchRecommendedJobs();
    } else {
      setRecommendedLoading(false);
    }
  }, []);

  // Client-side filtering function to handle case-insensitive matching
  const performClientSideFiltering = (jobs) => {
    if (!jobs || !Array.isArray(jobs)) return [];

    // Apply filters
    return jobs.filter((job) => {
      // Filter by search term
      if (search && search.trim() !== "") {
        const searchTerm = search.toLowerCase();

        // Search in title
        const titleMatches =
          job.title && job.title.toLowerCase().includes(searchTerm);

        // Search in company
        const companyMatches =
          job.company && job.company.toLowerCase().includes(searchTerm);

        // Search in skills
        const skillsMatch =
          Array.isArray(job.skills) &&
          job.skills.some((skill) => skill.toLowerCase().includes(searchTerm));

        // Search in description
        const descriptionMatches =
          job.description && job.description.toLowerCase().includes(searchTerm);

        // If none of the fields match, filter out this job
        if (
          !(titleMatches || companyMatches || skillsMatch || descriptionMatches)
        ) {
          return false;
        }
      }

      // Filter by skills
      if (
        filters.skills &&
        filters.skills.length > 0 &&
        filters.skills[0] !== ""
      ) {
        // Check if all required skills are present
        const hasAllSkills = filters.skills.every((requiredSkill) => {
          if (!job.skills || !Array.isArray(job.skills)) return false;
          return job.skills.some(
            (skill) => skill.toLowerCase() === requiredSkill.toLowerCase()
          );
        });

        if (!hasAllSkills) return false;
      }

      // Filter by location
      if (filters.location && filters.location.trim() !== "") {
        if (
          !job.location ||
          !job.location.toLowerCase().includes(filters.location.toLowerCase())
        ) {
          return false;
        }
      }

      // Filter by experience
      if (filters.experience) {
        // This assumes job.experience is a number
        if (!job.experience || job.experience < filters.experience) {
          return false;
        }
      }

      // Filter by job type
      if (filters.type && filters.type.trim() !== "") {
        if (
          !job.type ||
          !job.type.toLowerCase().includes(filters.type.toLowerCase())
        ) {
          return false;
        }
      }

      // If all filters pass, include this job
      return true;
    });
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);

      // Make a simpler API call to get ALL jobs - we'll filter client-side
      const response = await fetch(`${API_URL}/api/jobs`);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.jobs && Array.isArray(data.jobs)) {
        // Apply client-side filtering to handle case-insensitivity
        const filteredJobs = performClientSideFiltering(data.jobs);
        setAllJobs(filteredJobs);
      } else {
        console.error("Invalid jobs data format:", data);
        setAllJobs([]);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setAllJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendedJobs = async () => {
    try {
      setRecommendedLoading(true);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log(
          "No authentication token found, cannot fetch recommended jobs"
        );
        setRecommendedJobs([]);
        setRecommendedLoading(false);
        return;
      }
      
      console.log("Fetching recommended jobs...");
      
      const response = await fetch('http://localhost:5001/api/jobs/recommended', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error(`Error response: ${response.status}`);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Recommended jobs response:", data);
      
      // Handle both possible response structures
      if (data.recommendedJobs && Array.isArray(data.recommendedJobs)) {
        setRecommendedJobs(data.recommendedJobs);
      } else if (data.matchedJobs && Array.isArray(data.matchedJobs)) {
        setRecommendedJobs(data.matchedJobs);
      } else {
        console.error("Invalid recommended jobs format:", data);
        setRecommendedJobs([]);
      }
    } catch (error) {
      console.error("Error fetching recommended jobs:", error);
      setRecommendedJobs([]);
    } finally {
      setRecommendedLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      
      // Build query string from search and filters
      let queryParams = [];
      
      if (search) {
        queryParams.push(`search=${encodeURIComponent(search)}`);
      }
      
      if (filters.skills && filters.skills.length > 0) {
        queryParams.push(`skills=${encodeURIComponent(filters.skills.join(','))}`);
      }
      
      if (filters.location) {
        queryParams.push(`location=${encodeURIComponent(filters.location)}`);
      }
      
      if (filters.experience) {
        queryParams.push(`experience=${encodeURIComponent(filters.experience)}`);
      }
      
      // Fix the URL to include the base URL
      const url = `http://localhost:5001/api/jobs${queryParams.length > 0 ? `?${queryParams.join('&')}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.jobs && Array.isArray(data.jobs)) {
        setAllJobs(data.jobs);
      } else {
        console.error("Invalid jobs data format:", data);
        setAllJobs([]);
      }
    } catch (error) {
      console.error("Error searching jobs:", error);
      setAllJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewJob = (job) => {
    // Navigate to job details page
    const jobId = job._id;
    if (jobId) {
      router.push(`/jobs/${jobId}`);
    } else {
      console.error("Cannot navigate to job details: Missing job ID", job);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleApplyFilters = () => {
    setShowFilters(false);
    fetchJobs();
  };

  const handleViewAllJobs = () => {
    router.push("/jobs/all");
  };

  const handleViewAllRecommended = () => {
    router.push("/jobs/recommended");
  };

  const navigateToResumeUpload = () => {
    router.push("/profile/resume");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="relative mb-8 flex justify-center">
          <div className="relative w-full max-w-md">
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-5 w-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search Jobs by Title, Skills, or Company"
                className="w-full pl-10 pr-14 py-2 bg-white border border-gray-200 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#162660] focus:border-transparent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
              <Button
                variant="outline"
                size="sm"
                className="absolute right-1 h-8 px-3 text-sm rounded-full border-0"
                onClick={handleSearch}
                disabled={loading}
              >
                Search
              </Button>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="ml-2 w-10 h-10 rounded-full border border-gray-200"
            onClick={() => setShowFilters(!showFilters)}
            disabled={loading}
          >
            <Filter className="h-5 w-5 text-gray-600" />
          </Button>
        </div>

        {showFilters && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h3 className="text-lg font-medium mb-3">Filter Jobs</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g. JavaScript, React"
                  value={filters.skills.join(", ")}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      skills: e.target.value.split(",").map((s) => s.trim()),
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g. New York, Remote"
                  value={filters.location}
                  onChange={(e) =>
                    setFilters({ ...filters, location: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Experience (years)
                </label>
                <input
                  type="number"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g. 3"
                  value={filters.experience || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      experience: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                className="mr-2"
                onClick={() => {
                  setFilters({
                    skills: [],
                    location: "",
                    experience: null,
                    type: "",
                  });
                  setShowFilters(false);
                  fetchJobs();
                }}
              >
                Reset
              </Button>
              <Button
                className="bg-[#162660] hover:bg-[#0e1a45]"
                onClick={handleApplyFilters}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        )}

        <main>
          {isAuthenticated && resumeNotFound && (
            <ResumeUploadPrompt onNavigate={navigateToResumeUpload} />
          )}

          {isAuthenticated && !resumeNotFound && (
            <JobsCarousel
              title="Recommended Jobs"
              jobsData={recommendedJobs}
              onViewJob={handleViewJob}
              loading={recommendedLoading}
              onViewAll={handleViewAllRecommended}
            />
          )}

          <JobsCarousel
            title="All Jobs"
            jobsData={allJobs}
            onViewJob={handleViewJob}
            loading={loading}
            onViewAll={handleViewAllJobs}
          />
        </main>
      </div>
    </div>
  );
}
