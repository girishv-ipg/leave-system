import React, { Fragment } from 'react'
import CtaButton from './common/CtaButton'
import Footer from './common/Footer'
import { useRouter } from 'next/router'

const Landing = () => {

  const router = useRouter()

  

  return (
    <Fragment>
      <div className="w-full flex flex-col">
        <div className="grid lg:grid-cols-2 items-start">
          {/* detect location */}
          <div className="lg:p-10 p-5 lg:pl-20">
            <div className="flex justify-between items-center ">
              <div className="flex items-center gap-1">
                <img
                  src="/icons/swiggyLogo.svg"
                  alt="swiggyLogo"
                  className="w-10 h-10"
                />
                <p className="uppercase font-poppins lg:block hidden text-xl text-swiggyOrange font-semibold tracking-widest">
                  swiggy
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button className="bg-white p-2 px-7 text-black capitalize font-poppins text-base font-medium">
                  Login
                </button>
                <button className="bg-black p-2 px-7 text-white capitalize font-poppins text-base font-medium">
                  Sign up
                </button>
              </div>
            </div>

            <div className="my-10 flex flex-col">
              <h1 className="lg:text-4xl text-2xl font-poppins font-semibold text-footerDark">
                Movie marathon?
              </h1>
              <p className="lg:text-xl text-lg font-poppins font-thin mt-2 tracking-wide text-[#808080]">
                Order food from favourite restaurants near you.
              </p>

              <div className="lg:flex hidden items-center relative bg-white border border-gray-200 lg:my-7 my-5">
                <input
                  className="outline-none font-poppins p-[11px] w-full bg-transparent "
                  placeholder="Enter your delivery location"
                />

                <button className="absolute right-40 hover:bg-[#f2f2f2] text-xs p-2 font-poppins">
                  <div className="flex items-center gap-2">
                    <img
                      src="/icons/location.svg"
                      alt="crosshair"
                      className="w-5 h-5"
                    />
                    <p>Locate me</p>
                  </div>
                </button>

                <div className="absolute right-0 animate-pulse">
                  <CtaButton onClick={() => router.push('/restaurants')}>Find Food</CtaButton>
                </div>
              </div>

              <div className='lg:hidden flex flex-col items-start relative bg-white border border-gray-200 my-2'>
                <input
                  className="outline-none font-poppins p-[11px] w-full bg-transparent "
                  placeholder="Enter your delivery location"
                />
              </div>
              <div className='w-[150px] lg:hidden block animate-pulse'>
                <CtaButton onClick={() => router.push('/restaurants')}>
                  Find Food
                </CtaButton>
              </div>
              <br />

              <p className="font-poppins uppercase text-[#808080] text-base font-thin tracking-wide">
                POPULAR CITIES IN INDIA
              </p>
              <p className="text-sm mt-1 font-poppins text-footerDark opacity-80 capitalize font-medium">
                Ahmedabad, Bangalore, Chennai, Delhi, Gurgaon, Hyderabad,
                Kolkata, Mumbai, Pune & more.
              </p>
            </div>
          </div>

          {/* hero banner image */}
          <div>
            <img
              src="/images/herobanner.webp"
              alt="heroimage"
              className="h-[600px] w-full object-cover"
            />
          </div>
        </div>

        {/* features  */}
        <div className="w-full bg-[#2B1E16] lg:p-10 p-5">
          <div className="flex lg:flex-row flex-col items-center lg:justify-around -mt-10">
            {
              React.Children.toArray([
                {
                  name: 'no minimum order',
                  description:
                    'Order in for yourself or for the group, with no restrictions on order value',
                  image: '/images/no_min_order.webp',
                },
                {
                  name: 'live order tracking',
                  description:
                    'Know where your order is at all times, from the restaurant to your doorstep',
                  image: '/images/live_order.webp',
                },
                {
                  name: 'Lightning-Fast Delivery',
                  description: `Experience Swiggy's superfast delivery for food delivered fresh & on time`,
                  image: '/images/super_fast_delivery.webp',
                },
              ].map((item) => (
                <div className="flex flex-col gap-2 items-center text-center lg:w-[300px]">
                  <img
                    src={item.image}
                    alt={item.image}
                    className="scale-[0.7]"
                  />
                  <h1 className="text-white font-poppins lg:text-xl text-lg font-medium capitalize tracking-wide">
                    {item.name}
                  </h1>
                  <p className="font-poppins font-regular text-sm text-[#f2f2f2] tracking-wide">
                    {item.description}
                  </p>
                </div>
              )))
            }
          </div>
        </div>

        {/* restaurant in your pocket */}
        <div className="flex lg:flex-row flex-col items-center w-full lg:justify-center">
          <div className="flex flex-col gap-2 lg:w-[500px] lg:px-0 px-5 pt-5">
            <h1 className="lg:text-4xl text-2xl font-poppins font-semibold text-footerDark">
              Restaurants in <br /> your pocket
            </h1>

            <p className="lg:text-xl text-lg font-poppins font-thin mt-2 tracking-wide text-[#808080]">
              Order from your favorite restaurants & track on the go, with the
              all-new Swiggy app
            </p>

            <div className="flex lg:flex-row flex-col lg:items-center items-start gap-4 my-5">
              <img
                src="/images/app_store.png"
                alt="apple_store"
                className="w-[200px] cursor-pointer"
              />
              <img
                src="/images/play_store.png"
                alt="apple_store"
                className="w-[200px] cursor-pointer"
              />
            </div>
          </div>

          <div className="lg:flex hidden items-center">
            <img
              src="/images/phone2.webp"
              alt="phone_screen"
              className="w-[390px]"
            />
            <img
              src="/images/phone1.webp"
              alt="phone_screen"
              className="w-[390px]"
            />
          </div>
        </div>
      </div>
      <Footer flag />
    </Fragment>
  )
}

export default Landing
