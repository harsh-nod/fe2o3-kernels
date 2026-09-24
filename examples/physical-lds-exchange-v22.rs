#[cfg(feature = "physical-lds-exchange-one-v22")]
#[kernel(typed, launch(required=[128,1,1], max=[128,1,1], max_grid=[1,1,1]))]
pub fn physical_lds_exchange_one(input: &[u32], output: DisjointSlice<u32>) {
    amdgpu_physical_lds_exchange! {
        gfx942_xnack_off_wave64;
        input=input; output=output;
        lds=static_u32_frame(0, 512, 4, 1);
        label(0);
        s_load_dwordx2(s_pair(8), kernarg, 0);
        s_load_dwordx2(s_pair(10), kernarg, 8);
        s_load_dwordx2(s_pair(12), kernarg, 16);
        s_load_dwordx2(s_pair(14), kernarg, 24);
        s_waitcnt_lgkmcnt0();
        s_lshl_b32(s(16), s(2), 7);
        v_add_u32_e32(v(2), s(16), v(0));
        v_mov_b32_e32(v(3), zero);
        v_mov_b32_e32(v(4), s(9));
        v_lshlrev_b64(v_pair(6), v_pair(2), 2);
        v_add_co_u32_e32(v(6), s(8), v(6));
        v_addc_co_u32_e32(v(7), v(4), v(7));
        global_load_dword(v(8), v_pair(6));
        s_waitcnt_vmcnt0();
        v_lshlrev_b32(v(16), v(0), 2);
        ds_write_b32(v(16), v(8));
        s_waitcnt_lgkmcnt0();
        s_barrier();
        v_xor_b32_e32(v(17), v(0), 64);
        v_lshlrev_b32(v(17), v(17), 2);
        ds_read_b32(v(18), v(17));
        s_waitcnt_lgkmcnt0();
        v_mov_b32_e32(v(5), s(13));
        v_lshlrev_b64(v_pair(10), v_pair(2), 2);
        v_add_co_u32_e32(v(10), s(12), v(10));
        v_addc_co_u32_e32(v(11), v(5), v(11));
        v_cmp_gt_u64_e32(s_pair(14), v_pair(2));
        s_and_saveexec_b64(s_pair(18));
        global_store_dword(v_pair(10), v(18));
        s_waitcnt_vmcnt0();
        s_mov_b64_exec(s_pair(18));
        s_endpgm0();
    }
}
