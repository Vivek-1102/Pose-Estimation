"use client"

import PageLayout from "@/components/PageLayout"
import { ArrowRight, Award, BookOpen, Briefcase, GraduationCap, Users, Upload, Video } from "lucide-react"
import { motion } from "framer-motion"

export default function AboutPage() {
  // Team members data
  const teamMembers = [
    {
      name: "Dr. Sarah Johnson",
      role: "Lead Researcher",
      image: "/team-member-1.jpg",
      bio: "Dr. Johnson has over 15 years of experience in biomechanics and movement analysis. She leads our research team in developing advanced pose estimation algorithms for clinical applications.",
      education: "Ph.D. in Biomechanical Engineering, Stanford University",
      expertise: ["Movement Analysis", "Clinical Biomechanics", "AI in Healthcare"],
    },
    {
      name: "Michael Chen",
      role: "AI Engineer",
      image: "/team-member-2.jpg",
      bio: "Michael specializes in computer vision and deep learning. He has developed several state-of-the-art pose estimation models and leads our technical development team.",
      education: "M.S. in Computer Science, MIT",
      expertise: ["Computer Vision", "Deep Learning", "TensorFlow"],
    },
    {
      name: "Dr. Emily Rodriguez",
      role: "Clinical Director",
      image: "/team-member-3.jpg",
      bio: "Dr. Rodriguez brings clinical expertise to our team. As a practicing physical therapist, she ensures our technology meets real-world clinical needs and provides valuable insights for product development.",
      education: "Doctor of Physical Therapy, University of California",
      expertise: ["Rehabilitation", "Orthopedics", "Clinical Assessment"],
    },
    {
      name: "James Wilson",
      role: "UX/UI Designer",
      image: "/team-member-4.jpg",
      bio: "James is passionate about creating intuitive user experiences. He designs our interfaces with a focus on accessibility and ease of use for healthcare professionals.",
      education: "B.F.A. in Interaction Design, Rhode Island School of Design",
      expertise: ["User Experience", "Healthcare UI", "Accessibility"],
    },
  ]

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
        duration: 0.5,
      },
    },
  }

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">About Our Team</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Meet the experts behind Clinical Pose Estimation, combining expertise in biomechanics, artificial
            intelligence, and healthcare to revolutionize movement analysis.
          </p>
        </div>
      </section>

      {/* Our Mission */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6 animated-heading">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6">
                At Clinical Pose Estimation, we're dedicated to transforming movement analysis through cutting-edge
                technology. Our mission is to provide healthcare professionals with accurate, accessible tools for
                assessing human movement.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                We believe that objective measurement is the foundation of effective treatment. By combining artificial
                intelligence with clinical expertise, we're creating solutions that enhance patient care and improve
                outcomes.
              </p>
              <div className="flex items-center text-blue-600 font-medium">
                <a href="#team" className="flex items-center hover:text-blue-800 transition-colors">
                  Meet our team <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
              <div className="absolute -bottom-8 right-4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
              <div className="absolute -bottom-8 -left-20 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
              <div className="relative">
                <img
                  src="/mission-image.jpg"
                  alt="Healthcare professionals using pose estimation technology"
                  className="rounded-lg shadow-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 animated-heading">Meet Our Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our interdisciplinary team combines expertise in biomechanics, artificial intelligence, clinical practice,
              and user experience design.
            </p>
          </div>

          <motion.div className="space-y-24" initial="hidden" animate="visible" variants={containerVariants}>
            {/* Team member 1 - Left aligned */}
            <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center" variants={itemVariants}>
              <div className="order-2 md:order-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{teamMembers[0].name}</h3>
                <p className="text-blue-600 font-medium mb-4">{teamMembers[0].role}</p>
                <p className="text-gray-600 mb-4">{teamMembers[0].bio}</p>
                <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                  <div className="flex items-center mb-2">
                    <GraduationCap className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-gray-700 font-medium">Education</span>
                  </div>
                  <p className="text-gray-600 ml-7">{teamMembers[0].education}</p>
                </div>
                <div>
                  <div className="flex items-center mb-2">
                    <Award className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-gray-700 font-medium">Areas of Expertise</span>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-7">
                    {teamMembers[0].expertise.map((item, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2 flex justify-center">
                <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  <img
                    src={teamMembers[0].image || "/placeholder.svg"}
                    alt={teamMembers[0].name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </motion.div>

            {/* Team member 2 - Right aligned */}
            <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center" variants={itemVariants}>
              <div className="flex justify-center">
                <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  <img
                    src={teamMembers[1].image || "/placeholder.svg"}
                    alt={teamMembers[1].name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{teamMembers[1].name}</h3>
                <p className="text-blue-600 font-medium mb-4">{teamMembers[1].role}</p>
                <p className="text-gray-600 mb-4">{teamMembers[1].bio}</p>
                <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                  <div className="flex items-center mb-2">
                    <GraduationCap className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-gray-700 font-medium">Education</span>
                  </div>
                  <p className="text-gray-600 ml-7">{teamMembers[1].education}</p>
                </div>
                <div>
                  <div className="flex items-center mb-2">
                    <Award className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-gray-700 font-medium">Areas of Expertise</span>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-7">
                    {teamMembers[1].expertise.map((item, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Team member 3 - Left aligned */}
            <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center" variants={itemVariants}>
              <div className="order-2 md:order-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{teamMembers[2].name}</h3>
                <p className="text-blue-600 font-medium mb-4">{teamMembers[2].role}</p>
                <p className="text-gray-600 mb-4">{teamMembers[2].bio}</p>
                <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                  <div className="flex items-center mb-2">
                    <GraduationCap className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-gray-700 font-medium">Education</span>
                  </div>
                  <p className="text-gray-600 ml-7">{teamMembers[2].education}</p>
                </div>
                <div>
                  <div className="flex items-center mb-2">
                    <Award className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-gray-700 font-medium">Areas of Expertise</span>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-7">
                    {teamMembers[2].expertise.map((item, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2 flex justify-center">
                <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  <img
                    src={teamMembers[2].image || "/placeholder.svg"}
                    alt={teamMembers[2].name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </motion.div>

            {/* Team member 4 - Right aligned */}
            <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center" variants={itemVariants}>
              <div className="flex justify-center">
                <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  <img
                    src={teamMembers[3].image || "/placeholder.svg"}
                    alt={teamMembers[3].name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{teamMembers[3].name}</h3>
                <p className="text-blue-600 font-medium mb-4">{teamMembers[3].role}</p>
                <p className="text-gray-600 mb-4">{teamMembers[3].bio}</p>
                <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                  <div className="flex items-center mb-2">
                    <GraduationCap className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-gray-700 font-medium">Education</span>
                  </div>
                  <p className="text-gray-600 ml-7">{teamMembers[3].education}</p>
                </div>
                <div>
                  <div className="flex items-center mb-2">
                    <Award className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-gray-700 font-medium">Areas of Expertise</span>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-7">
                    {teamMembers[3].expertise.map((item, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 animated-heading">Our Values</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The principles that guide our work and shape our approach to clinical pose estimation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Evidence-Based Innovation</h3>
              <p className="text-gray-600">
                We ground our technology in scientific research and clinical evidence, ensuring our solutions deliver
                real-world value and accuracy.
              </p>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Clinical Excellence</h3>
              <p className="text-gray-600">
                We maintain the highest standards of clinical relevance and accuracy, developing tools that meet the
                rigorous demands of healthcare professionals.
              </p>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Accessibility</h3>
              <p className="text-gray-600">
                We believe advanced technology should be accessible to all healthcare providers. We design our solutions
                to be intuitive, affordable, and widely available.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Movement Analysis?</h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
            Experience the power of advanced pose estimation technology in your clinical practice.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/metrics"
              className="bg-white text-blue-700 hover:bg-blue-50 font-bold py-3 px-6 rounded-lg text-lg flex items-center justify-center transition-colors"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Images
            </a>
            <a
              href="/live-estimation"
              className="bg-blue-800 hover:bg-blue-900 text-white font-bold py-3 px-6 rounded-lg text-lg flex items-center justify-center transition-colors"
            >
              <Video className="w-5 h-5 mr-2" />
              Try Live Estimation
            </a>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}
