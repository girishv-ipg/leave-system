import CategoryCarousel from '@/components/CategoryCarousel'
import OfferCarousel from '@/components/OfferCarousel'
import RestaurantCarousel from '@/components/RestaurantCarousel'
import Card from '@/components/common/Card'
import Footer from '@/components/common/Footer'
import Header from '@/components/common/Header'
import SubHeading from '@/components/common/SubHeading'
import { popularRestaurants } from '@/utils/helpers'
import Link from 'next/link'
import React from 'react'

const FilterCta = (props) => {
  return (
    <button className="p-2 rounded-full px-3 border text-footerDark bg-white shadow capitalize">
      {props.children}
    </button>
  )
}


const Home = () => {
  return (
    <>
      <Header />
      <div className="lg:w-[1290px] m-auto flex flex-col lg:px-0 px-5 overflow-hidden">
        <div className="my-5 relative overflow-x-hidden">
          <SubHeading title="Best offers for you" />
          <OfferCarousel />
        </div>

        <div className="my-5 relative overflow-x-hidden">
          <SubHeading title="What's on your mind?" />
          <CategoryCarousel />
        </div>

        <div className="my-5 relative overflow-x-hidden">
          <SubHeading title="Top restaurant chains in Bangalore" />

          <div className="my-5 flex items-start">
            <div className="grid lg:grid-cols-8 grid-cols-2 gap-4">
              <FilterCta>
                <div className="flex items-center gap-2 justify-center">
                  <p className="text-sm capitalize font-poppins">Filter</p>
                  <img
                    src="/icons/filter.svg"
                    alt="filterIcon"
                    className="w-5 h-5"
                  />
                </div>
              </FilterCta>

              <FilterCta>
                <div className="flex items-center gap-2 justify-center">
                  <p className="text-sm capitalize font-poppins">Sort By</p>
                  <img
                    src="/icons/dropdown.svg"
                    alt="dropdownIcon"
                    className="w-5 h-5"
                  />
                </div>
              </FilterCta>

              {React.Children.toArray(
                [
                  'Fast Deliver',
                  'New on Swiggy',
                  'Ratings 4.0+',
                  'Pure Veg',
                  'Offers',
                  'Rs. 300 - Rs.600',
                  'Less than 300',
                ].map((item) => (
                  <FilterCta>
                    <div className="flex items-center gap-2 justify-center">
                      <p className="text-sm capitalize font-poppins">{item}</p>
                    </div>
                  </FilterCta>
                )),
              )}
            </div>
          </div>

          <RestaurantCarousel />
        </div>

        <hr className="border-gray-300" />

        <div className="my-5 lg:justify-start flex flex-col lg:items-start justify-center items-center">
          <SubHeading title="Restaurants with online food delivery in Bangalore" />

          <div className="grid lg:grid-cols-4 grid-cols-1 items-center justify-start gap-5 w-full">
            {React.Children.toArray(
              popularRestaurants.map((item) => (
                <Link
                  href={{
                    pathname: '/restaurants/view/' + item.name,
                    query: {
                      id: item.id,
                      name: item.name,
                      description: item.description,
                      rating: item.rating,
                      location: item.location,
                    },
                  }}
                >
                  <Card item={item} />
                </Link>
              )),
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default Home
