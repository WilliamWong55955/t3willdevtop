"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { PlusCircle, MinusCircle, Edit2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"

type Course = {
  id: string;
  course_name: string;
  course_code: string;
  units: number;
  department?: string;
}

type Semester = { id: string; name: string; courses: Course[] }

const semesterSuggestions = [
  'Fall 2024', 'Spring 2025', 'Summer 2025',
  'Fall 2025', 'Spring 2026', 'Summer 2026'
]

// Placeholder recommended schedule
const recommendedSchedule = [
  { semester: 1, courses: ['CSC 101', 'ENG 114', 'MATH 226', 'GE Area A', 'GE Area A'] },
  { semester: 2, courses: ['CSC 215', 'MATH 227', 'PHYS 220 & PHYS 222', 'GE Area E'] },
  { semester: 3, courses: ['CSC 220', 'CSC 230', 'MATH 225', 'PHYS 230 & PHYS 232', 'GE Area C'] },
  { semester: 4, courses: ['CSC 256', 'CSC 340', 'MATH 324', 'GE Area B2', 'GE Area C'] },
  { semester: 5, courses: ['CSC 300GW', 'CSC 317', 'CSC 510', 'GE Area C', 'GE Area D'] },
  { semester: 6, courses: ['CSC 413', 'CSC 415', 'Major Elective', 'GE Area D', 'GE Area F'] },
  { semester: 7, courses: ['Major Elective', 'Major Elective', 'GE Area UD-C', 'GE Area UD-D', 'SF State Studies'] },
  { semester: 8, courses: ['CSC 648', 'Major Elective', 'Major Elective', 'U.S. and California Government', 'GE Area UD-B'] },
]

export default function Component() {
  const [selectedMajor, setSelectedMajor] = useState<string | undefined>()
  const [semesters, setSemesters] = useState<Semester[]>([
    { id: 'semester1', name: '', courses: [] },
    { id: 'semester2', name: '', courses: [] },
    { id: 'semester3', name: '', courses: [] },
    { id: 'semester4', name: '', courses: [] },
  ])
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [completedCourses, setCompletedCourses] = useState<Course[]>([])
  const draggedCourse = useRef<{ course: Course, source: string } | null>(null)

  const [courseData, setCourseData] = useState<Course[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [majorsData, setMajorsData] = useState<{ id: number; name: string }[]>([])
  const [loadingMajors, setLoadingMajors] = useState<boolean>(true)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses')
        if (!response.ok) throw new Error("Failed to fetch courses")
        const data = await response.json() as Course[]
        setCourseData(data)
        setAvailableCourses(data)
      } catch (error) {
        console.error("Error fetching courses:", error)
      } finally {
        setLoading(false)
      }
    }

    void fetchCourses()
  }, [])

  useEffect(() => {
    const fetchMajors = async () => {
      try {
        const response = await fetch('/api/majors')
        if (!response.ok) throw new Error("Failed to fetch majors")
        const data = await response.json() as { id: number; name: string }[]
        setMajorsData(data)
      } catch (error) {
        console.error("Error fetching majors:", error)
      } finally {
        setLoadingMajors(false)
      }
    }
  
    void fetchMajors()
  }, [])

  const handleMajorChange = (majorId: string) => {
    setSelectedMajor(majorId)
    setCompletedCourses([])
    setSemesters([
      { id: 'semester1', name: '', courses: [] },
      { id: 'semester2', name: '', courses: [] },
      { id: 'semester3', name: '', courses: [] },
      { id: 'semester4', name: '', courses: [] },
    ])
    setAvailableCourses(courseData) // Reset available courses when changing major
  }

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, course: Course, source: string) => {
    draggedCourse.current = { course, source }
    e.dataTransfer.setData('text/plain', course.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault()
    if (draggedCourse.current) {
      const { course, source } = draggedCourse.current

      if (source === targetId) return

      // Remove course from source
      if (source === 'availableCourses') {
        setAvailableCourses(prev => prev.filter(c => c.id !== course.id))
      } else if (source === 'completedCourses') {
        setCompletedCourses(prev => prev.filter(c => c.id !== course.id))
      } else {
        setSemesters(prev => prev.map(sem => 
          sem.id === source ? { ...sem, courses: sem.courses.filter(c => c.id !== course.id) } : sem
        ))
      }

      // Add course to target
      if (targetId === 'availableCourses') {
        setAvailableCourses(prev => [...prev, course])
      } else if (targetId === 'completedCourses') {
        setCompletedCourses(prev => [...prev, course])
      } else {
        setSemesters(prev => prev.map(sem => 
          sem.id === targetId ? { ...sem, courses: [...sem.courses, course] } : sem
        ))
      }

      draggedCourse.current = null
    }
  }

  const handleCourseClick = (course: Course, source: string) => {
    if (source === 'completedCourses') {
      setCompletedCourses(prev => prev.filter(c => c.id !== course.id))
      setAvailableCourses(prev => [...prev, course])
    } else if (source.startsWith('semester')) {
      setSemesters(prev => prev.map(sem => 
        sem.id === source ? { ...sem, courses: sem.courses.filter(c => c.id !== course.id) } : sem
      ))
      setAvailableCourses(prev => [...prev, course])
    }
  }

  const addSemester = () => {
    setSemesters(prev => [...prev, { id: `semester${prev.length + 1}`, name: '', courses: [] }])
  }

  const removeSemester = () => {
    if (semesters.length > 1) {
      const lastSemester = semesters[semesters.length - 1]
      setAvailableCourses(prev => [...prev, ...lastSemester.courses])
      setSemesters(prev => prev.slice(0, -1))
    }
  }

  const renameSemester = (semesterId: string, newName: string) => {
    setSemesters(prev => prev.map(sem => 
      sem.id === semesterId ? { ...sem, name: newName } : sem
    ))
  }

  return (
    <div className="container mx-auto p-4">
      {loading ? (
        <p>Loading courses...</p>
      ) : (
        <div className="flex flex-wrap gap-4">
          {courseData.length === 0 ? (
            <p>No courses available.</p>
          ) : (
            courseData.map(course => (
              <div key={course.id} className="p-4 border rounded shadow">
                <p>{course.title}</p>
                <p>Code: {course.course_code}</p>
              </div>
            ))
          )}
        </div>
        )}
        {loadingMajors ? (
          <p>Loading majors...</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {majorsData.length === 0 ? (
              <p>No majors available.</p>
            ) : (
              majorsData.map(major => (
                <div key={major.id} className="p-4 border rounded shadow">
                  <h2>{major.name}</h2>
                  <p>ID: {major.id}</p>
                </div>
              ))
            )}
          </div>
        )}
      <h1 className="text-2xl font-bold mb-4">Course Planner</h1>
      <Select onValueChange={handleMajorChange}>
        <SelectTrigger className="w-[180px] mb-4">
          <SelectValue placeholder="Select your major" />
        </SelectTrigger>
        <SelectContent>
          {majors.map((major) => (
            <SelectItem key={major.id} value={major.id}>{major.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedMajor && (
        <>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Available Courses</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading courses...</p>
              ) : (
                <div 
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 min-h-[100px]"
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop(e, 'availableCourses')}
                >
                  {availableCourses.map((course) => (
                    <div
                      key={course.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, course, 'availableCourses')}
                      className="bg-secondary p-2 rounded cursor-move text-sm"
                    >
                      • {course.course_name} - {course.course_code}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Your Schedule</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button onClick={addSemester} size="sm" variant="outline" className="h-8 px-2 lg:px-3">
                    <PlusCircle className="h-4 w-4 lg:mr-2" />
                    <span className="sr-only lg:not-sr-only">Add Semester</span>
                  </Button>
                  <Button onClick={removeSemester} size="sm" variant="outline" className="h-8 px-2 lg:px-3" disabled={semesters.length <= 1}>
                    <MinusCircle className="h-4 w-4 lg:mr-2" />
                    <span className="sr-only lg:not-sr-only">Remove Semester</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {semesters.map((semester, index) => (
                    <div
                      key={semester.id}
                      onDragOver={onDragOver}
                      onDrop={(e) => onDrop(e, semester.id)}
                      className="bg-secondary p-2 pt-4 rounded-lg relative"
                    >
                      <div className="relative mb-2">
                        <h3 className="font-semibold text-sm truncate pr-6 mb-1">
                          {semester.name || `Semester ${index + 1}`}
                        </h3>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-5 w-5 p-0 rounded-full absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                              <Edit2 className="h-3 w-3" />
                              <span className="sr-only">Edit semester name</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="grid gap-4">
                              <div className="space-y-2">
                                <h4 className="font-medium leading-none">Rename Semester</h4>
                                <p className="text-sm text-muted-foreground">
                                  Enter a new name or select from suggestions.
                                </p>
                              </div>
                              <div className="grid gap-2">
                                <Input
                                  id={`rename-${semester.id}`}
                                  defaultValue={semester.name}
                                  onChange={(e) => renameSemester(semester.id, e.target.value)}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  {semesterSuggestions.slice(0, 4).map((suggestion) => (
                                    <Button
                                      key={suggestion}
                                      variant="outline"
                                      size="sm"
                                      className="justify-start"
                                      onClick={() => renameSemester(semester.id, suggestion)}
                                    >
                                      {suggestion}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <ul className="space-y-1">
                        {semester.courses.map((course) => (
                          <li
                            key={course.id}
                            draggable
                            onDragStart={(e) => onDragStart(e, course, semester.id)}
                            onClick={() => handleCourseClick(course, semester.id)}
                            className="bg-background p-1 rounded cursor-move hover:bg-accent text-sm"
                          >
                            • {course.course_name} - {course.course_code}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommended Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {recommendedSchedule.map((semester) => (
                    <div key={semester.semester} className="bg-secondary p-2 rounded-lg">
                      <h3 className="font-semibold text-sm mb-1">Semester {semester.semester}</h3>
                      <ul className="text-sm space-y-1">
                        {semester.courses.map((course, index) => (
                          <li key={index}>• {course}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Completed Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 min-h-[100px]"
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, 'completedCourses')}
              >
                {completedCourses.map((course) => (
                  <div
                    key={course.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, course, 'completedCourses')}
                    onClick={() => handleCourseClick(course, 'completedCourses')}
                    className="bg-secondary p-2 rounded cursor-move hover:bg-accent text-sm"
                  >
                    • {course.course_name} - {course.course_code}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <p className="mt-8 text-sm text-gray-500 italic">
            This is not a substitution for seeing an SFSU counsellor. Please confirm with your counsellor that the schedule you have created here is a valid and acceptable fit for you.
          </p>
        </>
      )}
    </div>
  )
}