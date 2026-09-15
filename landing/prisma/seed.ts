import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

async function main() {


  console.log('Admin user created:', admin.email)

  // Create 3 Blogs
  const posts = [
    {
      title: 'The Future of Serverless Infrastructure',
      slug: 'future-of-serverless-infrastructure',
      content: 'Serverless architecture is evolving rapidly. From FaaS to complete serverless ecosystems, the way we build and deploy applications is undergoing a fundamental shift. In this post, we explore how Putme.in is leading the charge in automating this transition.',
      excerpt: 'Exploring the rapid evolution of serverless ecosystems and automation.',
      isPublished: true,
    },
    {
      title: 'Scaling Engineering Teams with Putme.in',
      slug: 'scaling-engineering-teams',
      content: 'As organizations grow, the complexity of managing infrastructure can become a bottleneck. Putme.in simplifies this by providing automated SEO and infrastructure management, allowing your engineers to focus on building features rather than managing servers.',
      excerpt: 'How to maintain engineering velocity while scaling your organization.',
      isPublished: true,
    },
    {
      title: 'AI-Driven SEO: The Competitive Edge',
      slug: 'ai-driven-seo-edge',
      content: 'In the age of AI, search engines are changing. AEO (Answer Engine Optimization) and GEO (Generative Engine Optimization) are becoming as important as traditional SEO. Learn how our automated infrastructure keeps your content ahead of the curve.',
      excerpt: 'Navigating the shift from traditional SEO to AI-driven answer engines.',
      isPublished: true,
    },
  ]

  for (const post of posts) {
    const createdPost = await prisma.post.upsert({
      where: { slug: post.slug },
      update: post,
      create: post,
    })
    console.log('Post created/updated:', createdPost.slug)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
