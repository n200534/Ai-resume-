"use client";

import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import Image from "next/image";

const jobs = [
  {
    id: 1,
    name: "John Doe",
    position: "Software Engineer",
    description: "Expert in full-stack development.",
    skills: ["React", "Node.js", "TypeScript"],
    match: 90,
  },
  {
    id: 2,
    name: "Jane Smith",
    position: "UI/UX Designer",
    description: "Passionate about user experience.",
    skills: ["Figma", "Adobe XD", "CSS"],
    match: 75,
  },
  {
    id: 3,
    name: "Mike Johnson",
    position: "Data Scientist",
    description: "Loves working with machine learning.",
    skills: ["Python", "TensorFlow", "SQL"],
    match: 50,
  },
  {
    id: 4,
    name: "Sara Lee",
    position: "DevOps Engineer",
    description: "Experienced in cloud computing.",
    skills: ["AWS", "Docker", "Kubernetes"],
    match: 25,
  },
  {
    id: 5,
    name: "Alex Chen",
    position: "Product Manager",
    description: "Focused on user-centered solutions.",
    skills: ["Agile", "Jira", "Product Strategy"],
    match: 10,
  },
  {
    id: 12,
    name: "Alex Chen",
    position: "Product Manager",
    description: "Focused on user-centered solutions.",
    skills: ["Agile", "Jira", "Product Strategy"],
    match: 10,
  },
];

const recommendedJobs = [
  {
    id: 1,
    name: "John Doe",
    position: "Software Engineer",
    description: "Expert in full-stack development.",
    skills: ["React", "Node.js", "TypeScript"],
    match: 90,
  },
  {
    id: 6,
    name: "Emily Wilson",
    position: "Frontend Developer",
    description: "Creates beautiful user interfaces.",
    skills: ["React", "CSS", "JavaScript"],
    match: 80,
  },
  {
    id: 7,
    name: "Daniel Lopez",
    position: "Backend Developer",
    description: "Builds robust server architecture.",
    skills: ["Node.js", "MongoDB", "Express"],
    match: 85,
  },
  {
    id: 8,
    name: "Rachel Kim",
    position: "Full Stack Developer",
    description: "Works across the entire tech stack.",
    skills: ["React", "Node.js", "PostgreSQL"],
    match: 90,
  },
  {
    id: 9,
    name: "Jason Park",
    position: "Mobile Developer",
    description: "Creates cross-platform applications.",
    skills: ["React Native", "Firebase", "Redux"],
    match: 95,
  },
  {
    id: 10,
    name: "Jason Park",
    position: "Mobile Developer",
    description: "Creates cross-platform applications.",
    skills: ["React Native", "Firebase", "Redux"],
    match: 65,
  },
  {
    id: 11,
    name: "Jason Park",
    position: "Mobile Developer",
    description: "Creates cross-platform applications.",
    skills: ["React Native", "Firebase", "Redux"],
    match: 85,
  },
];

const getMatchColor = (match) => {
  if (match >= 75) return "text-green-600";
  if (match >= 30) return "text-orange-500";
  return "text-red-500";
};

const JobCard = ({ job }) => (
  <Card
    key={job.id}
    className="min-w-64 flex-shrink-0 shadow-md hover:shadow-lg transition-shadow duration-200"
  >
    <CardContent className="p-2">
      <div className="flex items-center space-x-4 mb-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden">
          <Image
            src="/avatar-placeholder.png"
            alt={`${job.name} avatar`}
            width={40}
            height={40}
            className="object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base text-[#162660] truncate">
            {job.name}
          </h3>
          <p className="text-gray-500 text-sm truncate">{job.position}</p>
        </div>
      </div>
      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
        {job.description}
      </p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {job.skills.map((skill, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-700"
          >
            {skill}
          </span>
        ))}
      </div>
      <div className="flex justify-between items-center mt-auto">
        <span className={`font-bold text-sm ${getMatchColor(job.match)}`}>
          {job.match}% Match
        </span>
        <Button
          variant="default"
          size="sm"
          className="bg-[#162660] hover:bg-[#0e1a45] text-white rounded-md text-xs"
        >
          View Job
        </Button>
      </div>
    </CardContent>
  </Card>
);

const JobsCarousel = ({ title, jobsData }) => {
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
          >
            <ChevronLeft size={18} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-8 h-8 rounded-full border border-gray-200"
            onClick={scrollRight}
          >
            <ChevronRight size={18} />
          </Button>
          <Button variant="link" className="text-[#162660] font-medium">
            View All
          </Button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={carouselRef}
          className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {jobsData.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default function JobsPage() {
  const [search, setSearch] = useState("");

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
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        <main>
          <JobsCarousel title="Recommended Jobs" jobsData={recommendedJobs} />
          <JobsCarousel title="All Jobs" jobsData={jobs} />
        </main>
      </div>
    </div>
  );
}
