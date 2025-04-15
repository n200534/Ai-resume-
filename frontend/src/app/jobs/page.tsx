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
  Building,
  MapPin,
  DollarSign,
  Calendar,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface PostedBy {
  company?: string;
}

interface Job {
  _id?: string;
  title?: string;
  position?: string;
  company?: string;
  location?: string;
  description?: string;
  salary?:
    | { currency?: string; amount?: number; min?: number; max?: number }
    | number
    | string
    | null;
  skills?: string[];
  postedBy?: PostedBy;
  matchScore?: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface Filters {
  skills: string[];
  location: string;
  experience: number | null;
  type: string;
}

interface JobCardProps {
  job: Job;
  onViewJob: (job: Job) => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onViewJob }) => {
  // Safely extract top 3 skills only
  const topSkills = Array.isArray(job.skills) ? job.skills.slice(0, 3) : [];

  // Handle salary display safely
  const formatSalary = (
    salary:
      | { currency?: string; amount?: number; min?: number; max?: number }
      | number
      | string
      | null
  ): string => {
    if (!salary) return "Salary not specified";

    // If salary is an object with currency property, handle it
    if (typeof salary === "object" && salary !== null) {
      const currencySymbol =
        salary.currency === "USD" ? "$" : salary.currency || "$";

      // Check if amount exists
      if (salary.amount != null) {
        return `${currencySymbol}${salary.amount.toLocaleString()}`;
      }
      if (salary.min != null && salary.max != null) {
        // Handle salary range
        return `${currencySymbol}${salary.min.toLocaleString()} - ${currencySymbol}${salary.max.toLocaleString()}`;
      }
      return "Salary details available";
    }

    // If salary is a number
    if (typeof salary === "number") {
      return `$${salary.toLocaleString()}`;
    }

    // If salary is a string with value
    if (typeof salary === "string" && salary.trim() !== "") {
      return salary;
    }

    return "Salary not specified";
  };

  // Function to determine score color based on match percentage
  const getScoreColor = (score: number): string => {
    const percentage = score * 100;
    if (percentage >= 75) return "bg-green-500";
    if (percentage >= 30) return "bg-orange-500";
    return "bg-red-500";
  };

  // Function to determine text color based on match percentage
  const getTextScoreColor = (score: number): string => {
    const percentage = score * 100;
    if (percentage >= 75) return "text-green-600";
    if (percentage >= 30) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <Card className="w-80 h-80 shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-l-[#0e1a45] bg-white rounded-lg flex flex-col">
      <CardContent className="p-2 pt-0 flex flex-col h-full">
        {/* Header section with company info */}
        <div className="flex flex-col mb-2 h-20">
          <h3 className="font-bold text-base text-[#162660] truncate">
            {job.title || job.position || "Untitled Position"}
          </h3>
          <div className="flex items-center mt-1">
            <Building className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0" />
            <p className="text-gray-700 font-medium text-sm truncate">
              {job.company || job.postedBy?.company || "Unknown Company"}
            </p>
          </div>
          <div className="flex items-center mt-1">
            <MapPin className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0" />
            <p className="text-gray-500 text-xs">
              {job.location || "Location not specified"}
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="h-16 mb-2">
          <p className="text-gray-600 text-sm line-clamp-3 overflow-hidden">
            {job.description || "No description available"}
          </p>
        </div>

        {/* Salary section */}
        <div className="h-6 mb-2">
          {job.salary && (
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
              <p className="text-[#162660] text-sm font-medium">
                {formatSalary(job.salary)}
              </p>
            </div>
          )}
        </div>

        {/* Skills section */}
        <div className="flex flex-wrap gap-1.5 mb-2 h-14 max-h-6 overflow-hidden">
          {topSkills.map((skill: string, idx: number) => (
            <span
              key={`skill-${idx}`}
              className="px-2 py-1 bg-gray-200 rounded-full text-xs text-[#162660] font-medium"
            >
              {skill}
            </span>
          ))}
          {job.skills && job.skills.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-500">
              +{job.skills.length - 3} more
            </span>
          )}
        </div>

        {/* Match score indicator - Commented out as in original */}
        {/* {job.matchScore !== undefined && (
          <div className="mt-auto mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 font-medium">
                Match Score
              </span>
              <span
                className={`text-xs font-semibold ${getTextScoreColor(
                  job.matchScore
                )}`}
              >
                {Math.round(job.matchScore)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`${getScoreColor(
                  job.matchScore
                )} h-1.5 rounded-full`}
                style={{ width: `${Math.min(100, job.matchScore)}%` }}
              ></div>
            </div>
          </div>
        )} */}

        {/* Button section - auto at bottom */}
        <div className="flex justify-center items-center mt-auto pt-2 border-t border-gray-100">
          <Button
            variant="default"
            size="sm"
            className="bg-[#162660] hover:bg-[#0e1a45] text-white rounded-md text-xs w-full transition-colors"
            onClick={() => onViewJob(job)}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface ResumeUploadPromptProps {
  onNavigate: () => void;
}

const ResumeUploadPrompt: React.FC<ResumeUploadPromptProps> = ({
  onNavigate,
}) => (
  <div className="bg-white border border-indigo-100 rounded-lg p-5 mb-8 shadow-sm">
    <div className="flex items-start">
      <div className="flex-shrink-0 pt-0.5">
        <AlertCircle className="h-5 w-5 text-indigo-500" />
      </div>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-[#162660]">Resume Required</h3>
        <div className="mt-2 text-sm text-gray-700">
          <p>
            Upload your resume to start getting personalized job
            recommendations.
          </p>
        </div>
        <div className="mt-4">
          <Button
            size="sm"
            className="bg-[#162660] hover:bg-[#0e1a45] text-white inline-flex items-center transition-colors"
            onClick={onNavigate}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Resume
          </Button>
        </div>
      </div>
    </div>
  </div>
);

interface JobsCarouselProps {
  title: string;
  jobsData: Job[];
  onViewJob: (job: Job) => void;
  loading: boolean;
  onViewAll: () => void;
}

const JobsCarousel: React.FC<JobsCarouselProps> = ({
  title,
  jobsData,
  onViewJob,
  loading,
  onViewAll,
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(false);

  useEffect(() => {
    const checkScrollability = () => {
      if (carouselRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };

    // Check initially and when data changes
    checkScrollability();

    // Add scroll event listener to update button states
    const currentRef = carouselRef.current;
    if (currentRef) {
      currentRef.addEventListener("scroll", checkScrollability);
      return () => currentRef.removeEventListener("scroll", checkScrollability);
    }
  }, [jobsData, loading]);

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  return (
    <div className="mb-12 relative">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-bold text-[#162660] flex items-center">
          {title === "Recommended Jobs" && (
            <Calendar className="mr-2 h-5 w-5 text-[#162660]" />
          )}
          {title === "All Jobs" && (
            <Briefcase className="mr-2 h-5 w-5 text-[#162660]" />
          )}
          {title}
        </h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className={`w-8 h-8 rounded-full border ${
              canScrollLeft
                ? "border-indigo-200 text-[#162660] hover:bg-gray-100"
                : "border-gray-200 text-gray-300 cursor-not-allowed"
            }`}
            onClick={scrollLeft}
            disabled={loading || !canScrollLeft}
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={`w-8 h-8 rounded-full border ${
              canScrollRight
                ? "border-indigo-200 text-[#162660] hover:bg-gray-100"
                : "border-gray-200 text-gray-300 cursor-not-allowed"
            }`}
            onClick={scrollRight}
            disabled={loading || !canScrollRight}
            aria-label="Scroll right"
          >
            <ChevronRight size={18} />
          </Button>
          <Button
            variant="link"
            className="text-[#162660] font-medium hover:text-[#0e1a45] transition-colors"
            disabled={loading}
            onClick={onViewAll}
          >
            View All
          </Button>
        </div>
      </div>

      <div className="relative">
        {loading ? (
          <div className="py-12 text-center bg-white rounded-lg shadow-sm">
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-700"></div>
            </div>
            <p className="text-gray-500 mt-2">Loading jobs...</p>
          </div>
        ) : (
          <div
            ref={carouselRef}
            className="flex space-x-5 overflow-x-auto pb-4 hide-scrollbar"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              scrollSnapType: "x mandatory",
              paddingBottom: "20px",
            }}
          >
            {jobsData && jobsData.length > 0 ? (
              jobsData.map((job, index) => (
                <div
                  key={job._id || `job-${index}`}
                  className="scroll-snap-align-start"
                  style={{ scrollSnapAlign: "start" }}
                >
                  <JobCard job={job} onViewJob={onViewJob} />
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center w-full py-16 bg-white rounded-lg shadow-sm min-w-full">
                <Briefcase className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No jobs found</p>
                <p className="text-gray-400 text-sm mt-1">
                  Try adjusting your search filters
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface PaginationControlsProps {
  pagination: Pagination;
  onPageChange: (page: number) => void;
  loading: boolean;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  pagination,
  onPageChange,
  loading,
}) => {
  const { page, pages, total } = pagination;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pages && !loading) {
      onPageChange(newPage);
    }
  };

  // Generate page numbers to display (show current page, 2 before and 2 after)
  const getPageNumbers = (): number[] => {
    const pageNumbers: number[] = [];
    const maxPagesToShow = 5;

    if (pages <= maxPagesToShow) {
      // If we have 5 or fewer pages, show all
      for (let i = 1; i <= pages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Otherwise show a window around current page
      let startPage = Math.max(1, page - 2);
      let endPage = Math.min(pages, startPage + maxPagesToShow - 1);

      // Adjust if we're near the end
      if (endPage - startPage < maxPagesToShow - 1) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }

    return pageNumbers;
  };

  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-center mt-6 mb-8">
      <Button
        variant="outline"
        size="sm"
        className="border-gray-200 text-gray-700 hover:bg-gray-50"
        onClick={() => handlePageChange(page - 1)}
        disabled={page === 1 || loading}
      >
        <ChevronLeft size={16} className="mr-1" />
        Previous
      </Button>

      <div className="flex items-center mx-2">
        {getPageNumbers().map((num) => (
          <button
            key={`page-${num}`}
            onClick={() => handlePageChange(num)}
            disabled={loading}
            className={`w-8 h-8 flex items-center justify-center rounded-full mx-1 text-sm ${
              page === num
                ? "bg-[#162660] text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {num}
          </button>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="border-gray-200 text-gray-700 hover:bg-gray-50"
        onClick={() => handlePageChange(page + 1)}
        disabled={page === pages || loading}
      >
        Next
        <ChevronRight size={16} className="ml-1" />
      </Button>
    </div>
  );
};

export default function JobsPage() {
  const router = useRouter();
  const [search, setSearch] = useState<string>("");
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [recommendedLoading, setRecommendedLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<Filters>({
    skills: [],
    location: "",
    experience: null,
    type: "",
  });
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [resumeNotFound, setResumeNotFound] = useState<boolean>(false);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [recommendedPagination, setRecommendedPagination] =
    useState<Pagination>({
      page: 1,
      limit: 10,
      total: 0,
      pages: 0,
    });

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

    // Add class to hide scrollbars
    const style = document.createElement("style");
    style.textContent = `
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const buildQueryParams = (): string => {
    const params = new URLSearchParams();

    // Add pagination params
    params.append("page", pagination.page.toString());
    params.append("limit", pagination.limit.toString());

    // Add search param if exists
    if (search) params.append("search", search);

    // Add filter params
    if (filters.skills.length > 0) {
      params.append("skills", filters.skills.join(","));
    }

    if (filters.location) params.append("location", filters.location);
    if (filters.experience != null)
      params.append("experience", filters.experience.toString());
    if (filters.type) params.append("type", filters.type);

    return params.toString();
  };

  const fetchJobs = async (): Promise<void> => {
    try {
      setLoading(true);

      const queryParams = buildQueryParams();
      const response = await fetch(`${API_URL}/api/jobs?${queryParams}`);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data: { jobs: Job[]; pagination?: Pagination } =
        await response.json();

      // Handle the new response format with pagination
      if (data.jobs && Array.isArray(data.jobs)) {
        setAllJobs(data.jobs);

        // Update pagination state if provided
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        console.error("Invalid jobs data format:", data);
        setAllJobs([]);
      }
    } catch (error: unknown) {
      console.error("Error fetching jobs:", error);
      setAllJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendedJobs = async (): Promise<void> => {
    try {
      setRecommendedLoading(true);
      setResumeNotFound(false);

      // Check if localStorage is available (client-side only)
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (!token) {
        console.error(
          "No authentication token found, cannot fetch recommended jobs"
        );
        setRecommendedJobs([]);
        setRecommendedLoading(false);
        return;
      }

      const params = new URLSearchParams();
      params.append("page", recommendedPagination.page.toString());
      params.append("limit", recommendedPagination.limit.toString());

      const response = await fetch(
        `${API_URL}/api/jobs/recommended?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          console.error("Authentication failed for recommended jobs");
        } else if (response.status === 404) {
          console.error("Resume not found for job recommendations");
          setResumeNotFound(true);
        } else {
          console.error(`Error response status: ${response.status}`);
        }
        setRecommendedJobs([]);
        return;
      }

      const data: { recommendedJobs: Job[]; pagination?: Pagination } =
        await response.json();

      if (data.recommendedJobs && Array.isArray(data.recommendedJobs)) {
        setRecommendedJobs(data.recommendedJobs);

        // Update pagination state if provided
        if (data.pagination) {
          setRecommendedPagination(data.pagination);
        }
      } else {
        console.error("Invalid recommended jobs data format:", data);
        setRecommendedJobs([]);
      }
    } catch (error: unknown) {
      console.error("Error fetching recommended jobs:", error);
      setRecommendedJobs([]);
    } finally {
      setRecommendedLoading(false);
    }
  };

  const handleSearch = (): void => {
    // Reset pagination to page 1 when searching
    setPagination({ ...pagination, page: 1 });
    fetchJobs();
  };

  const handlePageChange = (newPage: number): void => {
    setPagination({ ...pagination, page: newPage });
    fetchJobs();
  };

  const handleRecommendedPageChange = (newPage: number): void => {
    setRecommendedPagination({ ...recommendedPagination, page: newPage });
    fetchRecommendedJobs();
  };

  const handleViewJob = (job: Job): void => {
    // Store the selected job in localStorage to pass it between pages
    localStorage.setItem("selectedJobData", JSON.stringify(job));
    // Navigate to the view job page
    router.push("/jobs/viewjob");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleApplyFilters = (): void => {
    setShowFilters(false);
    // Reset pagination to page 1 when applying filters
    setPagination({ ...pagination, page: 1 });
    fetchJobs();
  };

  const handleViewAllJobs = (): void => {
    router.push("/jobs/all");
  };

  const handleViewAllRecommended = (): void => {
    router.push("/jobs/recommended");
  };

  const navigateToResumeUpload = (): void => {
    router.push("/profile/resume");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#162660] mb-2">
            Find Your Dream Job
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Search through our extensive job listings or get personalized
            recommendations based on your profile
          </p>
        </div>

        {/* Search and filter controls */}
        <div className="relative mb-8 flex justify-center">
          <div className="relative w-full max-w-xl">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-5 w-5 text-[#162660] pointer-events-none" />
              <input
                type="text"
                placeholder="Search Jobs by Title, Skills, or Company"
                className="w-full pl-12 pr-14 py-3 bg-white border border-indigo-100 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#162660] focus:border-transparent transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                aria-label="Search jobs"
              />
              <Button
                variant="default"
                size="sm"
                className="absolute right-1.5 bg-[#162660] hover:bg-[#0e1a45] h-9 px-4 text-sm rounded-full border-0 transition-colors"
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
            className="ml-3 w-12 h-12 rounded-full border border-indigo-200 bg-white text-[#162660] hover:bg-gray-100"
            onClick={() => setShowFilters(!showFilters)}
            disabled={loading}
            aria-label="Toggle filters"
            aria-expanded={showFilters}
          >
            <Filter className="h-5 w-5" />
          </Button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-indigo-50 transition-all">
            <h3 className="text-lg font-medium text-[#162660] mb-4 flex items-center">
              <Filter className="h-5 w-5 mr-2 text-[#162660]" />
              Filter Jobs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills
                </label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="e.g. JavaScript, React"
                  value={filters.skills.join(", ")}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      skills: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter((s) => s),
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
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
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
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="e.g. 3"
                  value={filters.experience ?? ""}
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
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setFilters({
                    skills: [],
                    location: "",
                    experience: null,
                    type: "",
                  });
                  setShowFilters(false);
                  // Reset pagination to page 1 when resetting filters
                  setPagination({ ...pagination, page: 1 });
                  fetchJobs();
                }}
              >
                Reset
              </Button>
              <Button
                className="bg-[#162660] hover:bg-[#0e1a45] transition-colors"
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
            <>
              <JobsCarousel
                title="Recommended Jobs"
                jobsData={recommendedJobs}
                onViewJob={handleViewJob}
                loading={recommendedLoading}
                onViewAll={handleViewAllRecommended}
              />
              {recommendedJobs.length > 0 && (
                <PaginationControls
                  pagination={recommendedPagination}
                  onPageChange={handleRecommendedPageChange}
                  loading={recommendedLoading}
                />
              )}
            </>
          )}

          <JobsCarousel
            title="All Jobs"
            jobsData={allJobs}
            onViewJob={handleViewJob}
            loading={loading}
            onViewAll={handleViewAllJobs}
          />

          {allJobs.length > 0 && (
            <PaginationControls
              pagination={pagination}
              onPageChange={handlePageChange}
              loading={loading}
            />
          )}
        </main>
      </div>
    </div>
  );
}
