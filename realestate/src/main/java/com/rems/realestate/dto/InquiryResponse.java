package com.rems.realestate.dto;

import com.rems.realestate.model.Inquiry;
import lombok.Data;

@Data
public class InquiryResponse {
    private Inquiry inquiry;
    private String statusMessage;

    public InquiryResponse(Inquiry inquiry, String statusMessage) {
        this.inquiry = inquiry;
        this.statusMessage = statusMessage;
    }
}
