// components/JobsPage.jsx

// must change the fetch API end points in the code 
"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search, Filter } from "lucide-react";
import Image from "next/image";

const getMatchColor = (match) => {
  if (match >= 75) return "text-green-600";
  if (match >= 30) return "text-orange-500";
  return "text-red-500";
};

const JobCard = ({ job, onViewJob }) => (
  <Card
    key={job.id || job._id}
    className="min-w-64 flex-shrink-0 shadow-md hover:shadow-lg transition-shadow duration-200"
  >
    <CardContent className="p-2">
      <div className="flex items-center space-x-4 mb-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden">
          <Image
            src="/avatar-placeholder.png"
            alt={`${job.company || job.name} avatar`}
            width={40}
            height={40}
            className="object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base text-[#162660] truncate">
            {job.company || job.name}
          </h3>
          <p className="text-gray-500 text-sm truncate">{job.title || job.position}</p>
        </div>
      </div>
      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
        {job.description}
      </p>
      {job.salary && (
        <p className="text-gray-700 text-sm font-medium mb-2">
          ${typeof job.salary === 'number' ? job.salary.toLocaleString() : job.salary}
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

const JobsCarousel = ({ title, jobsData, onViewJob, loading }) => {
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
          >
            View All
          </Button>
        </div>
      </div>

      <div className="relative">
        {loading ? (
          <div className="py-8 text-center">
            <p className="text-gray-500">Loading jobs...</p>
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
                  key={job.id || job._id} 
                  job={job} 
                  onViewJob={onViewJob} 
                />
              ))
            ) : (
              <p className="text-gray-500 py-4">No jobs found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const [allJobs, setAllJobs] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendedLoading, setRecommendedLoading] = useState(true);
  const [filters, setFilters] = useState({
    skills: [],
    location: "",
    experience: null
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Fetch jobs when component mounts
    fetchJobs();
    fetchRecommendedJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/jobs');
      
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
      console.error("Error fetching jobs:", error);
      setAllJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendedJobs = async () => {
    try {
      setRecommendedLoading(true);
      // Check if localStorage is available (client-side only)
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        console.log("No authentication token found, cannot fetch recommended jobs");
        setRecommendedJobs([]);
        setRecommendedLoading(false);
        return;
      }
      
      const response = await fetch('/api/jobs/match-jobs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log("Authentication failed for recommended jobs");
        } else {
          console.error(`Error response: ${response.status}`);
        }
        setRecommendedJobs([]);
        return;
      }
      
      const data = await response.json();
      
      if (data.matchedJobs && Array.isArray(data.matchedJobs)) {
        // Sort by match score and take top matches
        const topMatches = [...data.matchedJobs]
          .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
          .slice(0, 10);
          
        setRecommendedJobs(topMatches);
      } else {
        console.error("Invalid matched jobs data format:", data);
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
      
      const url = `/api/jobs${queryParams.length > 0 ? `?${queryParams.join('&')}` : ''}`;
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
    const jobId = job.id || job._id;
    if (jobId) {
      window.location.href = `/jobs/${jobId}`;
    } else {
      console.error("Cannot navigate to job details: Missing job ID", job);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen mx-auto px-4 py-6">
        <div className="relative mb-8 flex justify-center">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search All Jobs"
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#162660] focus:border-transparent"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Button 
              variant="outline"
              size="sm"
              className="absolute inset-y-0 right-0 px-3 flex items-center"
              onClick={handleSearch}
              disabled={loading}
            >
              Search
            </Button>
          </div>
        </div>

        <main>
          <JobsCarousel 
            title="Recommended Jobs" 
            jobsData={recommendedJobs} 
            onViewJob={handleViewJob} 
            loading={recommendedLoading}
          />
          <JobsCarousel 
            title="All Jobs" 
            jobsData={allJobs} 
            onViewJob={handleViewJob} 
            loading={loading}
          />
        </main>
      </div>
    </div>
  );
}