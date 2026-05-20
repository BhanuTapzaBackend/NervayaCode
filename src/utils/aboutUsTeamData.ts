export interface TeamMember {
  id: number;
  name: string;
  title: string;
  description: string;
  image: string;
}

export const aboutUsTeamData: TeamMember[] = [
  {
    id: 1,
    name: 'Anshuman Lal',
    title: 'Founder & CEO',
    description:
      'A B.Tech graduate from Indian Institute of Technology (BHU), Varanasi, he started Nervaya after dealing with long-term sleep issues himself. He focuses on building practical, herbal and holistic solutions for better sleep, combining supplements, neuroplasticity-based approaches, and mental wellness support.',
    image: 'https://res.cloudinary.com/disrq2eh8/image/upload/anshuman_ustpfx.jpg',
  },
  {
    id: 2,
    name: 'Kavya Sree Chinasani',
    title: 'Co-Founder & Product Leader',
    description:
      'A BITS Pilani graduate, she co-founded Nervaya after experiencing sudden-onset sleep challenges and recognizing the scale of sleep issues across India. She believes complex problems can be solved through simple, structured systems, and focuses on building experiences that make better sleep and mental well-being easier to achieve and sustain.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop',
  },
];
