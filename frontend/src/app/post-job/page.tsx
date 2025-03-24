"use client";

import React, { useState } from 'react';

export default function PostJobPage() {
  const [jobData, setJobData] = useState({
    title: '',
    company: '',
    location: '',
    description: '',
    salary: '',
    requirements: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setJobData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/jobs/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(jobData)
      });

      if (response.ok) {
        alert('Job posted successfully!');
        // Reset form
        setJobData({
          title: '',
          company: '',
          location: '',
          description: '',
          salary: '',
          requirements: ''
        });
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Failed to post job'}`);
      }
    } catch (error) {
      console.error('Job posting error:', error);
      alert('An error occurred while posting the job');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Post a New Job</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">Job Title</label>
          <input
            type="text"
            name="title"
            value={jobData.title}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded"
            placeholder="Enter job title"
          />
        </div>

        <div>
          <label className="block mb-2">Company</label>
          <input
            type="text"
            name="company"
            value={jobData.company}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded"
            placeholder="Company name"
          />
        </div>

        <div>
          <label className="block mb-2">Location</label>
          <input
            type="text"
            name="location"
            value={jobData.location}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded"
            placeholder="Job location"
          />
        </div>

        <div>
          <label className="block mb-2">Salary</label>
          <input
            type="text"
            name="salary"
            value={jobData.salary}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded"
            placeholder="Salary range (optional)"
          />
        </div>

        <div>
          <label className="block mb-2">Job Description</label>
          <textarea
            name="description"
            value={jobData.description}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded"
            rows={4}
            placeholder="Describe the job responsibilities"
          />
        </div>

        <div>
          <label className="block mb-2">Requirements</label>
          <textarea
            name="requirements"
            value={jobData.requirements}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded"
            rows={4}
            placeholder="List job requirements and qualifications"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Post Job
        </button>
      </form>
    </div>
  );
}