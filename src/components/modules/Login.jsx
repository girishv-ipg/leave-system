import React, { useEffect, useState } from 'react'
import InputBox from '../common/Inputbox'
import CtaButton from '../common/CtaButton'
import Logo from '../common/Logo'
import Link from 'next/link'


// Import React FilePond
import { FilePond, File, registerPlugin } from 'react-filepond'
// Import FilePond styles
import 'filepond/dist/filepond.min.css'
// Import the Image EXIF Orientation and Image Preview plugins
// Note: These need to be installed separately
// `npm i filepond-plugin-image-preview filepond-plugin-image-exif-orientation --save`
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation'
import FilePondPluginImagePreview from 'filepond-plugin-image-preview'
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css'
// Register the plugins
registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview)

const Login = () => {

    const [params, setParams] = useState({
        email: '',
        password: ''
    })

    const handleChange = (e) => {
        let { name, value } = e.target
        setParams({ ...params, [name]: value })
    }

    const [show, setShow] = useState(false)

    const [isOwner, setIsOwner] = useState(false)

    const toggleHandler = () => {
        setIsOwner(!isOwner)
    }

    const [newParams, setNewParams] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
        confirm_password: '',

        // restaurant fields
        restaurant_name: '',
        street: '',
        city: '',
        state: '',
        postalCode: '',
        res_phone: '',
        image: '',
        rating: ''
    })

    const handleNewParams = (e) => {
        let { name, value } = e.target
        setNewParams({ ...newParams, [name]: value })
    }

    const [files, setFiles] = useState([])

    useEffect(() => {
        fetch('https://source.unsplash.com/random/1440*800?food')
            .then((response) => {
                console.log(response)
            })
            .catch((error) => {
                console.log(error)
            })
    }, [])

    return (
        <div className='h-screen flex lg:flex-row flex-col items-center'>

            <div className='lg:w-7/12 lg:block hidden'>
                <img
                    src="/images/sectionImage.jpg"
                    alt=""
                    className='lg:block hidden h-screen w-full object-cover'
                />
            </div>

            <div className='lg:w-5/12 bg-white lg:p-10 p-5 flex flex-col w-full justify-start items-start'>


                {
                    isOwner ?
                        <div className='flex flex-col w-full gap-4 justify-start items-start'>
                            <Logo link="#" />

                            <p className='text-footerDark text-center text-sm font-poppins font-medium my-2'>Don&apos;t have an account?
                                <span className='cursor-pointer text-[#808080]' onClick={toggleHandler}> Sign up here</span>
                            </p>

                            <InputBox
                                name={"email"}
                                label={"Email"}
                                onChange={handleChange}
                                value={params.email}
                                styles={'w-full'}
                            />

                            <div className='relative w-full'>
                                <InputBox
                                    name={"password"}
                                    label={"Password"}
                                    onChange={handleChange}
                                    value={params.password}
                                    styles={'w-full'}
                                    type={!show ? 'password' : 'text'}
                                />

                                <div onClick={() => setShow(!show)} className='absolute top-5 right-5 cursor-pointer'>
                                    {
                                        !show ?
                                            <img src="/icons/eyeOpen.svg" alt="eyeOpen" className='w-5 h-5' /> :
                                            <img src="/icons/eyeClose.svg" alt="eyeClose" className='w-5 h-5' />
                                    }
                                </div>

                            </div>

                            <CtaButton>
                                <Link href="/dashboard">
                                    Login
                                </Link>
                            </CtaButton>
                        </div> :

                        <div className='flex flex-col w-full gap-4 justify-start items-start '>
                            <Logo link="#" />

                            <p className='text-footerDark text-center text-sm font-poppins font-medium my-2'>Already have an account?
                                <span className='cursor-pointer text-[#808080]' onClick={toggleHandler}> Sign in here</span>
                            </p>

                            <div className=' py-2 px-2 h-[360px] overflow-y-scroll flex flex-col w-full gap-4'>
                                <InputBox
                                    name={"name"}
                                    label={"Name"}
                                    onChange={handleNewParams}
                                    value={newParams.name}
                                    styles={'w-full'}
                                />

                                <InputBox
                                    name={"phone"}
                                    label={"Phone"}
                                    onChange={handleNewParams}
                                    value={newParams.phone}
                                    styles={'w-full'}
                                />

                                <InputBox
                                    name={"email"}
                                    label={"Email"}
                                    onChange={handleNewParams}
                                    value={newParams.email}
                                    styles={'w-full'}
                                />

                                <div className='relative w-full'>
                                    <InputBox
                                        name={"password"}
                                        label={"Password"}
                                        onChange={handleNewParams}
                                        value={newParams.password}
                                        styles={'w-full'}
                                        type={!show ? 'password' : 'text'}
                                    />

                                    <div onClick={() => setShow(!show)} className='absolute top-5 right-5 cursor-pointer'>
                                        {
                                            !show ?
                                                <img src="/icons/eyeOpen.svg" alt="eyeOpen" className='w-5 h-5' /> :
                                                <img src="/icons/eyeClose.svg" alt="eyeClose" className='w-5 h-5' />
                                        }
                                    </div>

                                </div>

                                <div className='relative w-full'>
                                    <InputBox
                                        name={"confirm_password"}
                                        label={"Confirm Password"}
                                        onChange={handleNewParams}
                                        value={newParams.confirm_password}
                                        styles={'w-full'}
                                        type={!show ? 'password' : 'text'}
                                    />

                                    <div onClick={() => setShow(!show)} className='absolute top-5 right-5 cursor-pointer'>
                                        {
                                            !show ?
                                                <img src="/icons/eyeOpen.svg" alt="eyeOpen" className='w-5 h-5' /> :
                                                <img src="/icons/eyeClose.svg" alt="eyeClose" className='w-5 h-5' />
                                        }
                                    </div>

                                </div>

                                <InputBox
                                    name={"restaurant_name"}
                                    label={"Restaurant Name"}
                                    onChange={handleNewParams}
                                    value={newParams.restaurant_name}
                                    styles={'w-full'}
                                />

                                <InputBox
                                    name={"res_phone"}
                                    label={"Restaurant Phone"}
                                    onChange={handleNewParams}
                                    value={newParams.res_phone}
                                    styles={'w-full'}
                                />

                                <div className='grid grid-cols-2 gap-4 w-full'>

                                    <InputBox
                                        name={"street"}
                                        label={"Street"}
                                        onChange={handleNewParams}
                                        value={newParams.street}
                                        styles={'w-full'}
                                    />

                                    <InputBox
                                        name={"city"}
                                        label={"City"}
                                        onChange={handleNewParams}
                                        value={newParams.city}
                                        styles={'w-full'}
                                    />

                                    <InputBox
                                        name={"state"}
                                        label={"State"}
                                        onChange={handleNewParams}
                                        value={newParams.state}
                                        styles={'w-full'}
                                    />

                                    <InputBox
                                        name={"postalCode"}
                                        label={"Postal Code"}
                                        onChange={handleNewParams}
                                        value={newParams.postalCode}
                                        styles={'w-full'}
                                    />



                                </div>

                                <div>
                                    <p className='text-sm font-poppins font-medium my-2'>Upload Image for Restaurant</p>
                                    <FilePond
                                        files={files}
                                        onupdatefiles={setFiles}
                                        allowMultiple={true}
                                        maxFiles={3}
                                        // server="/api"
                                        name="files"
                                        labelIdle='Drop image file here (or) <span class="filepond--label-action">Browse</span>'
                                        allowFileTypeValidation={true}
                                        fileValidateTypeLabelExpectedTypesMap={{ 'image/jpeg': '.jpg' }}
                                    />
                                </div>

                            </div>



                            <CtaButton>
                                <Link href="/dashboard">
                                    Sign up
                                </Link>
                            </CtaButton>
                        </div>
                }

            </div>

        </div>

    )
}

export default Login