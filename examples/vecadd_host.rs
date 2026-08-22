// Current generated typed launch path; benchmark setup and validation omitted.
let context = GpuContext::new(0)?;
let stream = context.default_stream();
let a_dev = DeviceBuffer::from_host(&stream, &a_host)?;
let b_dev = DeviceBuffer::from_host(&stream, &b_host)?;
let mut c_dev = DeviceBuffer::<f32>::zeroed(&stream, N)?;

let kernel = vecadd_gpu::Kernel::load(&context)?;
kernel
    .prepare(&a_dev, &b_dev, &mut c_dev)?
    .launch(&stream)?;
